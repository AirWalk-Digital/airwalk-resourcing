import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import * as React from 'react';

import { baseTheme } from '../../constants/baseTheme';


export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang='en' style={{ scrollBehavior: 'smooth' }}>
      <body>
          <ThemeProvider theme={baseTheme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            {props.children}
          </ThemeProvider>
      </body>
    </html>
  );
}
