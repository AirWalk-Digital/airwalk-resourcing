// pages/resources/resources.js

import formidable from 'formidable-serverless';
import { promises as fs } from 'fs';
import {
  cacheWrite,
  cacheRead,
  cacheMRead,
  cacheSearch,
  cacheDelete,
} from '../../../lib/redis'; // Adjust the path as necessary
import {
  parseExcelXml,
  expandResourceData,
  calculateDemand,
  timesheetPortalHolidays,
  combineResourcesWithHolidays,
} from '../../../lib/loaders'; // Adjust the path as necessary

// import users from "./users.json";
// import { each } from 'cheerio/lib/api/traversing';

export const config = {
  api: {
    bodyParser: false,
  },
};

const extractEmailsForRedis = (jsonData) => {
  // Parse the JSON data
  const data = JSON.parse(jsonData);

  // Extract the 'mail' field from each object
  const emails = data.map((item) => item.mail).filter((mail) => mail);

  // Return the array of emails
  return emails;
};

const extractCodeForRedis = (jsonData) => {
  // Parse the JSON data
  const data = JSON.parse(jsonData);

  // Initialize an array to hold the code-role_id combinations
  const codeRoleCombinations = [];

  // Iterate over each item
  data.forEach((item) => {
    const code = item.Code;
    // Iterate over each date in Roles
    Object.keys(item.Roles).forEach((date) => {
      // Iterate over each role on that date
      item.Roles[date].forEach((role) => {
        // Create a combination of Code and role_id
        const combination = `${code}-${role.role_id}`;
        codeRoleCombinations.push(combination);
      });
    });
  });

  // Return the array of code-role_id combinations
  return codeRoleCombinations;
};

function mergeApiAndRedisResults(apiResults, redisResults) {
  // Parse the API results if they are in string format
  const parsedApiResults =
    typeof apiResults === 'string' ? JSON.parse(apiResults) : apiResults;

  // Filter out null values from Redis results and parse each JSON string
  const validRedisResults = redisResults
    .filter((item) => item !== null)
    .map((item) => JSON.parse(item));

  // Convert the valid Redis results to a map for efficient lookup
  const redisDataMap = new Map(
    validRedisResults.map((item) => [item.resource, item])
  );

  // Merge the API results with the corresponding Redis data
  const mergedResults = parsedApiResults.map((apiItem) => {
    const redisData = redisDataMap.get(apiItem.mail);

    // If there's matching Redis data, merge it (excluding the 'resource' field)
    if (redisData) {
      const { resource, ...otherRedisData } = redisData;
      return { ...apiItem, info: { ...otherRedisData } };
    }

    // If there's no matching Redis data, return the API item as is
    return apiItem;
  });

  return mergedResults;
}

async function fetchWithAuthorization(url, token) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

async function getAccessToken(tenantId, clientId, clientSecret) {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  const body = new URLSearchParams({
    client_id: clientId,
    scope: 'https://graph.microsoft.com/.default',
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  });

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const result = await response.json();

    // eslint-disable-next-line no-console
    console.error(result);
    throw new Error(`HTTP error!: ${result.error_description}`);
  }

  const data = await response.json();
  return data.access_token;
}

function cleanFields(userData) {
  Object.keys(userData).forEach((key) => {
    if (typeof userData[key] === 'string') {
      try {
        // eslint-disable-next-line no-param-reassign
        userData[key] = userData[key].trim();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error cleaning field ${key}: ${error}`);
        // eslint-disable-next-line no-console
        console.error(`Error cleaning field ${userData[key]}`);
      }
    }
  });
  return userData;
}

async function getUsersFromAzureAD(token) {
  const baseUrl = 'https://graph.microsoft.com/v1.0';
  const fields = [
    'id',
    'displayName',
    'userPrincipalName',
    'givenName',
    'surname',
    'jobTitle',
    'mail',
    'mobilePhone',
    'officeLocation',
    'preferredLanguage',
    'department',
    'faxNumber',
  ];

  let users = [];
  let usersUrl = `${baseUrl}/users?$select=${fields.join(',')}`;

  while (usersUrl) {
    // eslint-disable-next-line no-await-in-loop
    const data = await fetchWithAuthorization(usersUrl, token);
    users = users.concat(data.value.map(cleanFields));
    usersUrl = data['@odata.nextLink'];
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const user of users) {
    const managerUrl = `${baseUrl}/users/${user.id}/manager?$select=mail,displayName`;
    try {
      // eslint-disable-next-line no-await-in-loop
      const managerData = await fetchWithAuthorization(managerUrl, token);
      user.manager_email = managerData.mail;
      user.manager = managerData.displayName;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching manager for user ${user.id}: ${error}`);
      user.manager_email = null;
    }
  }

  return users;
}

async function getUsers() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_APP_CLIENT_ID;
  const clientSecret = process.env.AZURE_APP_CLIENT_SECRET;
  try {
    const token = await getAccessToken(tenantId, clientId, clientSecret);
    const users = await getUsersFromAzureAD(token);
    return users;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting users:', error);
    throw new Error(`Error getting users: ${error}`);
  }
}

// eslint-disable-next-line consistent-return
export default async function handler(req, res) {
  const cacheKey = 'geco-all-resources';
  if (req.method === 'POST') {
    // Parse the multipart form data
    const data = await new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm();
      // eslint-disable-next-line consistent-return
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve(files);
      });
    });

    try {
      // Access the uploaded file
      const file = data.file instanceof Array ? data.file[0] : data.file;
      if (!file) {
        throw new Error('No file uploaded.');
      }

      // Read the file from the uploaded path
      const content = await fs.readFile(file.path, 'utf-8');

      // Process the file content through parseExcelXml
      try {
        const jsonData = await parseExcelXml(content);
        let users = {};
        // console.debug('/api/upload: ', jsonData);
        try {
          users = JSON.parse(await cacheRead('aad-users'));
          if (!users) {
            throw new Error('No users in cache');
          }
        } catch (error) {
          users = await getUsers();
          cacheWrite('aad-users', JSON.stringify(users), 60 * 60 * 24 * 7);
        }

        const resourceData = expandResourceData(jsonData, users);

        const holidays = await timesheetPortalHolidays(
          process.env.TSP_CLIENT_ID,
          process.env.TSP_CLIENT_SECRET
        );
        // const groupedHolidays = groupLeaveData()
        const resourceDataWithHolidays = combineResourcesWithHolidays(
          resourceData,
          holidays
        );
        // res.status(200).json({'resource': resourceData, 'holidays': holidays}); // Respond with JSON data

        const demandData = calculateDemand(resourceData);

        try {
          await cacheWrite('geco-excel-conversion', JSON.stringify(jsonData)); // attempt to cache data
        } catch (cacheError) {
          // If cacheWrite fails, log the error but dont send a 500 response
          console.error(
            '[API/resourcing/resources/POST][Cache Write Error (geco-excel-conversion)]:',
            cacheError
          );
        }
        try {
          await cacheWrite('geco-demand', JSON.stringify(demandData)); // attempt to cache data
        } catch (cacheError) {
          // If cacheWrite fails, log the error and send a 500 response
          res.status(500).json({ error: 'Failed to write to cache.' });
          console.error(
            '[API/resourcing/resources/POST][Cache Write Error (geco-demand)]:',
            cacheError
          );
        }

        try {
          await cacheWrite(cacheKey, JSON.stringify(resourceDataWithHolidays)); // attempt to cache data
          res.status(200).json(resourceDataWithHolidays); // Respond with JSON data
        } catch (cacheError) {
          // If cacheWrite fails, log the error and send a 500 response
          console.error(
            '[API/resourcing/resources/POST][Cache Write Error (',
            cacheKey,
            ')]:',
            cacheError
          );
          res.status(500).json({ error: 'Failed to write to cache.' });
          // Stop further execution
        }
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'GET') {
    if (req.query.demand === 'true') {
      try {
        const obj = await cacheRead('geco-demand');

        const jobCodes = extractCodeForRedis(obj);

        console.log('API:Demand:GET: ', jobCodes);

        const redisPrefix = 'geco-placeholder-*';
        const reservations = await cacheSearch(redisPrefix);

        // Function to strip off the prefix and trailing details
        const stripPrefix = (reservation) => {
          const parts = reservation.split('geco-placeholder-');
          return parts[1];
        };
        // Strip off the prefix 'geco-placeholder-' and any following content after the demand key
        const strippedReservations = reservations.map(stripPrefix);

        // Filter the reservations to find those not in demand
        const unmatchedReservations = strippedReservations.filter(
          (reservation) => !jobCodes.includes(reservation)
        );

        // Re-add the prefix and prepare keys for deletion
        const keysToDelete = reservations.filter((reservation) => {
          const strippedKey = stripPrefix(reservation);
          return unmatchedReservations.includes(strippedKey);
        });

        console.log('unmatchedReservations', keysToDelete);
        // Delete each key from Redis
        // eslint-disable-next-line no-unused-expressions
        keysToDelete &&
          keysToDelete.forEach(async (key) => {
            try {
              await cacheDelete(key);
              console.log(`Deleted key: ${key}`);
            } catch (error) {
              console.error(`Error deleting key ${key}:`, error);
            }
          });

        res.status(200).json({ content: obj });
      } catch (error) {
        // console.log(error)
        res.status(500).json({ error: `error fetching from cache: ${error}` });
      }
    } else {
      try {
        const obj = await cacheRead(cacheKey);
        const resourceData = await cacheMRead(
          extractEmailsForRedis(obj),
          '{geco-resource}-'
        );
        // console.log(resourceData)
        const mergedResourceData = mergeApiAndRedisResults(obj, resourceData);
        // console.log('API:Cache: ', req.query.key, ' : ', obj );
        res.status(200).json({ content: JSON.stringify(mergedResourceData) });
      } catch (error) {
        // console.log(error)
        res.status(500).json({ error: `error fetching from cache: ${error}` });
      }
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST, GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
