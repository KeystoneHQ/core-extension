import { Runtime, Tabs, Windows } from 'webextension-polyfill-ts';
import extension from 'extensionizer';

import { NOTIFICATION_WIDTH, NOTIFICATION_HEIGHT } from '@src/utils/constants';

const checkForError = () => {
  const { lastError } = extension.runtime;
  if (!lastError) {
    return undefined;
  }
  // if it quacks like an Error, its an Error
  if (lastError.stack && lastError.message) {
    return lastError;
  }
  // repair incomplete error object (eg chromium v77)
  return new Error(lastError.message);
};

export const openNewTab = (options: { url: string; selected?: boolean }) => {
  return new Promise((resolve, reject) => {
    extension.tabs.create(options, (newTab: Tabs.Tab) => {
      const error = checkForError();
      if (error) {
        return reject(error);
      }
      return resolve(newTab);
    });
  });
};

export const openWindow = (options: Windows.CreateCreateDataType) => {
  return new Promise((resolve, reject) => {
    extension.windows.create(options, (newWindow: Windows.Window) => {
      return resolve(newWindow);
    });
  });
};

export const getTabs = () => {
  return extension.tabs.query((tabs: Tabs.Tab) => {});
};

export const openExtensionInBrowser = (route = null, queryString = null) => {
  let extensionURL = extension.runtime.getURL('popup.html');

  if (queryString) {
    extensionURL += `?${queryString}`;
  }

  if (route) {
    extensionURL += `#${route}`;
  }

  openNewTab({ url: extensionURL });
};

export const openExtensionNewWindow = (
  route?: string,
  queryString?: string
) => {
  let extensionURL = extension.runtime.getURL('popup.html');

  if (queryString) {
    extensionURL += `?${queryString}`;
  }

  if (route) {
    extensionURL += `#/${route}`;
  }

  let left = 0;
  let top = 0;

  const { width, height } = window.screen;

  top = Math.max(height, 0);
  left = Math.max(width + (width - NOTIFICATION_WIDTH), 0);

  openWindow({
    url: extensionURL,
    focused: true,
    type: 'popup',
    height: NOTIFICATION_HEIGHT,
    width: NOTIFICATION_WIDTH,
    left,
    top,
  });
};

export const reload = () => {
  extension.runtime.reload();
};

export default {
  openNewTab,
  openWindow,
  openExtensionInBrowser,
  openExtensionNewWindow,
  getTabs,
};