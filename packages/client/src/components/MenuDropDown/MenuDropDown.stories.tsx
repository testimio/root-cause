import React from 'react';
import { MenuDropDown } from './MenuDropDown';
import { action } from '@storybook/addon-actions';

import HarIcon from '../../globalAssets/har@3x.svg';
import TestLogIcon from '../../globalAssets/TestLog.svg';

export default {
  title: 'Menu drop down',
  component: MenuDropDown,
};

export function AsIs() {
  return (
    <MenuDropDown
      onItemClick={action('item-click')}
      items={[
        {
          slug: 'download_har_file',
          text: 'Download HAR file',
          icon: HarIcon,
        },
        {
          slug: 'download_log_file',
          text: 'Download test log',
          icon: TestLogIcon,
        },
      ]}
    />
  );
}
