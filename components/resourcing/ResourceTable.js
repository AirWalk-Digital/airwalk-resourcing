import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Table,
  Switch,
  FormGroup,
  FormControlLabel,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
} from '@mui/material';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

function determineColor(mo) {
  // Provide default values when fields are null
  const hypo = parseInt(mo.days_hypo, 10) || 0;
  const working = parseInt(mo.days_working, 10) || 0;
  const holiday = parseInt(mo.holiday, 10) || 0;
  const days = parseInt(mo.days_allocated, 10) || 0;
  // if (!mo.days_working) {
  // console.log('determineColor: ', holiday )
  // }
  if (hypo === 0) {
    return 'primary';
  }
  if (days + holiday > working) return 'error';
  if (days + holiday < hypo) return 'primary';
  return 'success';
}

function UserPopup({ data, open, handleClose }) {
  // Example toggles' state
  const [toggleSC, setToggleSC] = useState(false);
  const [toggleTIR, setToggleTIR] = useState(false);
  const [toggleMH, setToggleMH] = useState(false);
  const [resource, setResource] = useState(null);

  const updateUser = async () => {
    const recordProposal = {
      resource: data.mail,
      sc: toggleSC,
      tir: toggleTIR,
      mh: toggleMH,
    };
    console.log('updated:', recordProposal);
    try {
      const response = await fetch('/api/resourcing/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordProposal),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result); // Process the response as needed
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }
  };

  // Handle toggle change
  const handleToggleChange = (toggleSetter) => (event) => {
    toggleSetter(event.target.checked);
  };

  useEffect(() => {
    if (resource) {
      setToggleSC(resource.sc);
      setToggleTIR(resource.tir);
      setToggleMH(resource.mh);
    }
  }, [resource]);

  useEffect(() => {
    if (resource) {
      updateUser();
    }
  }, [toggleSC, toggleTIR, toggleMH]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/resourcing/resources?resource=${data.mail}`
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const fetchedData = await response.json();
        // console.log('Resource:response: ', response)

        if (fetchedData.content && fetchedData.content.length > 0) {
          const jsonParsedData = JSON.parse(fetchedData.content);
          setResource(jsonParsedData); // Adjust according to actual API response
        } else {
          // record doesn't exist yet
          const recordProposal = {
            resource: data.mail,
            sc: false,
            tir: false,
            mh: false,
          };

          setResource(recordProposal); // Adjust according to actual API response
        }

        // console.log('Resource:jsonParsedData: ', jsonParsedData)
      } catch (err) {
        console.error('Resource:ERROR: ', err);
      }
    };

    fetchData();
  }, []);

  const LoadingSkeleton = () => {
    return (
      <FormGroup>
        {Array.from(new Array(3)).map((_, index) => (
          <FormControlLabel
            key={index}
            control={<Skeleton variant='rectangular' width={40} height={20} />}
            label={<Skeleton variant='text' width={100} />}
          />
        ))}
      </FormGroup>
    );
  };

  if (!resource) {
    return (
      <Dialog open={open} onClose={handleClose} fullWidth>
        <DialogTitle>
          {data.displayName || data.name} {` - ${data.jobTitle}` || ''}
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <LoadingSkeleton />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>
        {data.displayName || data.name} {` - ${data.jobTitle}` || ''}
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={toggleSC}
                onChange={handleToggleChange(setToggleSC)}
              />
            }
            label='SC Cleared'
          />
          <FormControlLabel
            control={
              <Switch
                checked={toggleTIR}
                onChange={handleToggleChange(setToggleTIR)}
              />
            }
            label='TIR'
          />
          <FormControlLabel
            control={
              <Switch
                checked={toggleMH}
                onChange={handleToggleChange(setToggleMH)}
              />
            }
            label='Mansion House'
          />
        </FormGroup>
      </DialogContent>
    </Dialog>
  );
}

function ResourceInfo({ info }) {
  if (info) {
    return (
      <Stack
        direction='row'
        justifyContent='flex-start'
        alignItems='center'
        spacing={0.5}
      >
        {info.sc && <Chip size='small' label='SC' variant='outlined' />}
        {info.mh && <Chip size='small' label='MH' variant='outlined' />}
        {info.tir && <Chip size='small' label='TIR' variant='outlined' />}
      </Stack>
    );
  }
}

function Row({
  data,
  displayedMonths,
  setPopupContent,
  setShowPopup,
  placeholder,
  refreshData,
}) {
  // console.debug('Row: ', data)
  // if (placeholder) {
  //     console.debug('Placeholder: ', placeholder)
  // }
  // {
  const [popupOpen, setPopupOpen] = useState(false);

  const handleInfoClick = () => {
    setPopupOpen(!popupOpen);
  };

  const handleClose = () => {
    setPopupOpen(false);
  };

  return (
    <TableRow>
      <TableCell style={{ whiteSpace: 'nowrap', width: 'max-content' }}>
        <Stack
          direction='row'
          spacing={1}
          justifyContent='space-between'
          alignItems='center'
        >
          {data.displayName || data.name}
          {data.info && <ResourceInfo info={data.info} />}
          <InfoIcon onClick={handleInfoClick} />
        </Stack>
        {popupOpen && (
          <UserPopup
            data={data}
            open={popupOpen}
            handleClose={() => {
              handleClose();
              refreshData(); // <-- Invoke refreshData after closing the popup
            }}
          />
        )}
      </TableCell>
      <TableCell style={{ whiteSpace: 'nowrap', width: 'max-content' }}>
        {data.department || 'Associate'}
      </TableCell>

      {displayedMonths.map((month) => (
        <TableCell
          align='center'
          size='small'
          // sx={{ width: '100px' }}
          key={month}
          // style={{
          //     backgroundColor: data.jobs.some(item => item.month === month) ?
          //         determineColor(data.jobs.find(item => item.month === month).days_allocated,
          //             data.jobs.find(item => item.month === month).days_hypo)
          //         : 'transparent'
          // }}
          onClick={() => {
            const monthData = data.jobs.find((item) => item.month === month);
            console.log('monthData: ', monthData);
            setPopupContent(monthData ? monthData.jobs : null);
            setShowPopup(true);
          }}
        >
          <Stack
            direction='row'
            spacing={1}
            justifyContent='center'
            alignItems='center'
          >
            {data.jobs.some((item) => item.month === month) &&
              data.jobs.find((item) => item.month === month).holiday > 0 && (
                <Chip
                  icon={<BeachAccessIcon />}
                  sx={{ color: 'primary' }}
                  label={data.jobs.find((item) => item.month === month).holiday}
                />
              )}
            {placeholder &&
              placeholder.monthlyDetails &&
              placeholder.monthlyDetails[month] && (
                // <WorkOutlineIcon />
                <Chip
                  icon={<WorkOutlineIcon />}
                  sx={{ color: 'primary' }}
                  label={placeholder.monthlyDetails[month].days_allocated}
                />
              )}
            {data.jobs.some((item) => item.month === month) &&
              data.jobs.find((item) => item.month === month).days_allocated >
                0 && (
                <Chip
                  sx={{
                    color: 'white',
                    width: '100%',
                    // minWidth: (placeholder?.monthlyDetails?.[month]?.days_allocated > 0) ? '50px' : '100px',
                  }}
                  color={
                    data.jobs.some((item) => item.month === month)
                      ? determineColor(
                          data.jobs.find((item) => item.month === month)
                        )
                      : 'transparent'
                  }
                  label={
                    data.jobs.find((item) => item.month === month)
                      .days_allocated
                  }
                />
              )}
            {data.jobs.some((item) => item.month === month) &&
              data.jobs.find((item) => item.month === month).days_forecast >
                0 && (
                <Chip
                  sx={{
                    color: 'grey',
                    width: '100%',
                    // minWidth: (placeholder?.monthlyDetails?.[month]?.days_allocated > 0) ? '50px' : '100px',
                  }}
                  // color={
                  //     data.jobs.some(item => item.month === month) ?
                  //         determineColor(data.jobs.find(item => item.month === month))
                  //         : 'transparent'
                  // }
                  label={
                    data.jobs.find((item) => item.month === month).days_forecast
                  }
                />
              )}
          </Stack>
        </TableCell>
      ))}
    </TableRow>
  );
}

const ResourceTableSkeleton = () => {
  return (
    <Table size='small' style={{ tableLayout: 'fixed' }}>
      <TableHead>
        <TableRow>
          <TableCell colSpan={6}>
            <Skeleton variant='rectangular' width='100%' height={20} />
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[...Array(10)].map((e, i) => (
          <TableRow key={i}>
            {[...Array(6)].map((_e, index) => (
              <TableCell key={index}>
                <Skeleton variant='text' />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const ResourceTable = ({ bench = false }) => {
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  //   const [disciplineFilter, setDisciplineFilter] = useState("");
  const [monthStartIndex, setMonthStartIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [placeholder, setPlaceholder] = useState(null);
  const [months, setMonths] = useState([]);
  //   const [months, setMonths] = useState([]);

  //   const [filterRedMonths, setFilterRedMonths] = useState(false);
  //   const [filterTIR, setFilterTIR] = useState(false);
  //   const [filterSC, setFilterSC] = useState(false);
  //   const [filterMH, setFilterMH] = useState(false);

  const displayedMonths = months
    ? months.slice(monthStartIndex, monthStartIndex + 3)
    : [];

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/resourcing/demand');
      if (!response.ok) throw new Error('Network response was not ok');
      const fetchedData = await response.json();
      const jsonParsedData = JSON.parse(fetchedData.content);
      setData(jsonParsedData); // Adjust according to actual API response
      setMonths(
        Array.from(
          new Set(
            jsonParsedData.flatMap((item) => item.jobs.map((b) => b.month))
          )
        ).sort()
      );
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
    console.log('ResourceTable:refreshData:loading: ', isLoading);
  };

  function groupByMailAndSumDays(fetchedData) {
    const groupedData = {};

    fetchedData.forEach((item) => {
      if (!groupedData[item.resource]) {
        groupedData[item.resource] = {
          displayName: item.displayName,
          monthlyDetails: {},
        };
        Object.keys(item.monthlyDetails).forEach((month) => {
          groupedData[item.resource].monthlyDetails[month] = {
            days_allocated: item.monthlyDetails[month].days_allocated,
          };
        });
      } else {
        Object.keys(item.monthlyDetails).forEach((month) => {
          if (!groupedData[item.resource].monthlyDetails[month]) {
            groupedData[item.resource].monthlyDetails[month] = {
              days_allocated: item.monthlyDetails[month].days_allocated,
            };
          } else {
            groupedData[item.resource].monthlyDetails[month].days_allocated +=
              item.monthlyDetails[month].days_allocated;
          }
        });
      }
    });

    return groupedData;
  }

  const fetchPlaceholderData = async () => {
    try {
      const response = await fetch('/api/resourcing/placeholder');
      if (!response.ok) throw new Error('Network response was not ok');
      const fetchedData = await response.json();
      console.debug('Resource:placeholder: ', fetchedData.content);

      // const jsonParsedData = JSON.parse(fetchedData.content.length > 0 ? fetchedData.content : null)
      setPlaceholder(groupByMailAndSumDays(fetchedData.content)); // Adjust according to actual API response
      // console.debug('Resource:placeholder: ', jsonParsedData)
    } catch (err) {
      console.error('Resource:ERROR: ', err);
    }
  };

  useEffect(() => {
    refreshData();
    fetchPlaceholderData();
  }, []);

  const sortUsersByName = (users) => {
    return users
      .filter((user) => user.displayName != null)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  };

  useEffect(() => {
    // const sortUsersByName = (users) => {
    //   return users
    //     .filter((user) => user.displayName != null)
    //     .sort((a, b) => a.displayName.localeCompare(b.displayName));
    // };

    const filterRowsWithNoJobsAndLessHolidays = (users, chosenMonths) => {
      return users.filter((user) => {
        // Condition 1: Check if the user has no jobs in one or more of the displayed months
        const hasNoJobsInDisplayedMonths = chosenMonths.some(
          (month) => !user.jobs.some((job) => job.month.startsWith(month))
        );

        // Condition 2: Check if days_allocated plus holiday is less than days_hypo minus 3, using 18 if days_hypo is undefined
        // Only for jobs within the displayed months
        const hasLessDaysAllocated = user.jobs.some((job) => {
          const isInDisplayedMonths = chosenMonths.some((displayedMonth) =>
            job.month.startsWith(displayedMonth)
          );
          if (!isInDisplayedMonths) {
            return false; // Skip this job if it's not in one of the displayed months
          }

          const holiday = job.holiday || 0; // If there is no holiday, default to 0
          const daysHypo = job.days_hypo || 18; // Use 18 if days_hypo is not defined
          const daysAllocated = job.days_allocated || 0;
          return daysAllocated + holiday < daysHypo - 3;
        });

        // Return true if either condition is met
        return hasNoJobsInDisplayedMonths || hasLessDaysAllocated;
      });
    };

    if (data && data.length > 0 && !isLoading) {
      console.debug('ResourceTable:refreshData:loading: ', isLoading);
      console.debug('ResourceTable:refreshData:data: ', data);

      console.log(
        'Null Users: ',
        data.filter((user) => user.displayName === null)
      );

      let usersToDisplay = sortUsersByName(data);
      usersToDisplay = usersToDisplay.filter(
        (item) => item.department !== 'Operations'
      );
      if (bench) {
        // Only apply this filter if bench prop is true
        usersToDisplay = filterRowsWithNoJobsAndLessHolidays(
          usersToDisplay,
          displayedMonths
        );
        usersToDisplay = usersToDisplay.filter(
          (item) => item.department !== 'Operations'
        );
      }

      setFilteredData(usersToDisplay);
    }
  }, [data]);

  // Define the initial state for the filters
  const [filters, setFilters] = useState({
    Red: false,
    TIR: false,
    SC: false,
    MH: false,
    Discipline: null,
  });

  const handleFilterChange = (filterName, toggled) => {
    // Create a new filters object
    const newFilters = { ...filters, [filterName]: toggled };

    // Update the state of the changed filter
    setFilters(newFilters);

    let usersToDisplay = sortUsersByName(data);
    usersToDisplay = usersToDisplay.filter(
      (item) => item.department !== 'Operations'
    );

    console.log('handleFilterChange:filters: ', newFilters);
    console.log('handleFilterChange:filterName: ', filterName, ' - ', toggled);
    // Apply all active filters
    if (newFilters.Discipline) {
      usersToDisplay = usersToDisplay.filter(
        (item) => item.department === toggled
      );
    }
    if (newFilters.Red) {
      usersToDisplay = usersToDisplay.filter((user) => {
        // Check if any job matches the criteria
        const hasRedMonth = user.jobs.some((job) => {
          const isDisplayedMonth = displayedMonths.includes(job.month);
          const color = determineColor(job);
          return isDisplayedMonth && color === 'error';
        });
        return hasRedMonth;
      });
    }
    if (newFilters.TIR) {
      usersToDisplay = usersToDisplay.filter((user) => user.info?.tir);
    }
    if (newFilters.SC) {
      console.log('handleFilterChange:SC: ', newFilters.SC);
      usersToDisplay = usersToDisplay.filter((user) => user.info?.sc);
    }
    if (newFilters.MH) {
      usersToDisplay = usersToDisplay.filter((user) => user.info?.mh);
    }
    console.log('handleFilterChange:usersToDisplay: ', usersToDisplay);

    setFilteredData(usersToDisplay);
  };

  if (isLoading) {
    return <ResourceTableSkeleton />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Paper>
      <Box padding={2}>
        <FormGroup row>
          <FormControlLabel
            control={
              <Switch
                checked={filters.Red}
                onChange={(e) => handleFilterChange('Red', e.target.checked)}
              />
            }
            label='Over allocated'
          />
          <FormControlLabel
            control={
              <Switch
                checked={filters.TIR}
                onChange={(e) => handleFilterChange('TIR', e.target.checked)}
              />
            }
            label='TIR'
          />
          <FormControlLabel
            control={
              <Switch
                checked={filters.SC}
                onChange={(e) => handleFilterChange('SC', e.target.checked)}
              />
            }
            label='SC'
          />
          <FormControlLabel
            control={
              <Switch
                checked={filters.MH}
                onChange={(e) => handleFilterChange('MH', e.target.checked)}
              />
            }
            label='Mansion House'
          />
        </FormGroup>
      </Box>

      <Table size='small' style={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>
              Business Unit
              <Select
                value=''
                onChange={(e) =>
                  handleFilterChange('Discipline', e.target.value)
                }
                displayEmpty
                size='small'
                // sx={{ ml: 1 }}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                    outline: 'none',
                  },
                  '&.MuiSelect-select:focus': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                <MenuItem value=''></MenuItem>
                {Array.from(new Set(data?.map((item) => item.department) || []))
                  .sort() // This will sort the array alphabetically
                  .map((discipline) => (
                    <MenuItem key={discipline} value={discipline}>
                      {discipline}
                    </MenuItem>
                  ))}
              </Select>
            </TableCell>
            {displayedMonths.map((month, index) => (
              <TableCell
                align='center'
                key={month}
                sx={{
                  mx: '5px',
                  pl: index === 0 ? '0px' : '5px',
                  pr: index === 2 ? '0px' : '5px',
                }}
              >
                {index === 0 && (
                  <IconButton
                    // sx={{ position: 'absolute', right: 8, top: 8 }}

                    disabled={monthStartIndex === 0}
                    onClick={() =>
                      setMonthStartIndex((prev) => Math.max(prev - 1, 0))
                    }
                    sx={{ pl: '0' }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                )}
                {new Date(month).toLocaleString('default', { month: 'long' })}
                {index === displayedMonths.length - 1 && (
                  <IconButton
                    variant='contained'
                    disabled={monthStartIndex + 3 >= months.length}
                    onClick={() =>
                      setMonthStartIndex((prev) =>
                        Math.min(prev + 1, months.length - 3)
                      )
                    }
                    sx={{ marginLeft: 1 }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map((item) => {
            const value =
              placeholder && placeholder[item.mail]
                ? placeholder[item.mail]
                : null;
            if (value) {
              console.log('item : --- ', item);
              console.log('placeholder  ----', placeholder);
              console.log('placeholder value --- : ', value);
            }
            return (
              <Row
                key={item.name}
                data={item}
                displayedMonths={displayedMonths}
                setPopupContent={setPopupContent}
                setShowPopup={setShowPopup}
                refreshData={refreshData}
                placeholder={value}
              />
            );
          })}
        </TableBody>
      </Table>

      <Dialog fullWidth open={showPopup} onClose={() => setShowPopup(false)}>
        <DialogTitle>
          Job Details
          <IconButton
            onClick={() => setShowPopup(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {popupContent && (
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Days</TableCell>
                  <TableCell>JSO</TableCell>
                  <TableCell>Customer</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {popupContent.map((job) => (
                  <TableRow
                    key={
                      typeof job.job_s_ord_code === 'string'
                        ? job.job_s_ord_code
                        : job.description
                    }
                  >
                    <TableCell>{job.days}</TableCell>
                    <TableCell>
                      {job.description}{' '}
                      {typeof job.contract_type === 'string'
                        ? job.contract_type
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {typeof job.customer === 'string'
                        ? job.customer
                        : 'OTHER'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default ResourceTable;
