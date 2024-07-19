import { createTheme } from '@mui/material/styles';
import { expect } from '@playwright/test';

import { getContrastYIQ } from './colors';

describe('getContrastYIQ', () => {
  const theme = createTheme();

  it('should return the primary text color when the contrast is high', () => {
    const result = getContrastYIQ('#FFFFFF', theme);
    expect(result).toBe(theme.palette.text.primary);
  });

  it('should return the secondary text color when the contrast is low', () => {
    const result = getContrastYIQ('#000000', theme);
    expect(result).toBe(theme.palette.text.secondary);
  });

  it('should handle hexcolor as a number', () => {
    const result = getContrastYIQ(0xffffff, theme);
    expect(result).toBe(theme.palette.text.primary);
  });

  it('should handle hexcolor as an object', () => {
    const result = getContrastYIQ({ toString: () => '#FFFFFF' }, theme);
    expect(result).toBe(theme.palette.text.primary);
  });
});
