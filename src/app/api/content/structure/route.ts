import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getLogger } from '@/lib/Logger';

const logger = getLogger().child({ namespace: 'API:/api/content/structure' });
logger.level = 'error';
// export const config = {
//   api: {
//     responseLimit: '8mb',
//   },
// };

export async function GET(req: NextRequest) {
  try {
    const { collection } = Object.fromEntries(req.nextUrl.searchParams);

    if (!collection) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo, or path' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: `Error in API` }, { status: 500 });
  } catch (err) {
    return NextResponse.json(
      { error: `Error in API: ${err}` },
      { status: 500 }
    );
  }
}
