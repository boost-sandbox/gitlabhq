import { STATUS_ALL, STATUS_CLOSED, STATUS_OPEN } from '~/issues/constants';
import { __ } from '~/locale';

export const IssuableListTabs = [
  {
    id: 'state-opened',
    name: STATUS_OPEN,
    title: __('Open'),
    titleTooltip: __('Filter by issues that are currently opened.'),
  },
  {
    id: 'state-closed',
    name: STATUS_CLOSED,
    title: __('Closed'),
    titleTooltip: __('Filter by issues that are currently closed.'),
  },
  {
    id: 'state-all',
    name: STATUS_ALL,
    title: __('All'),
    titleTooltip: __('Show all issues.'),
  },
];

export const AvailableSortOptions = [
  {
    id: 1,
    title: __('Created date'),
    sortDirection: {
      descending: 'created_desc',
      ascending: 'created_asc',
    },
  },
  {
    id: 2,
    title: __('Updated date'),
    sortDirection: {
      descending: 'updated_desc',
      ascending: 'updated_asc',
    },
  },
];

export const DEFAULT_PAGE_SIZE = 20;

export const DEFAULT_SKELETON_COUNT = 5;

export const PAGE_SIZE_STORAGE_KEY = 'issuable_list_page_size';
