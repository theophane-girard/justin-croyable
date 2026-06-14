import React from 'react';
import { render } from '@testing-library/react-native';

import MobileDs from './mobile-ds';

describe('MobileDs', () => {
  it('should render successfully', () => {
    const { root } = render(<MobileDs />);
    expect(root).toBeTruthy();
  });
});
