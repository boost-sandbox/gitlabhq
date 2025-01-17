import Vue from 'vue';
import { GlEmptyState } from '@gitlab/ui';

import { mountExtended } from 'helpers/vue_test_utils_helper';
import GroupFolderComponent from '~/groups/components/group_folder.vue';
import GroupItemComponent from '~/groups/components/group_item.vue';
import PaginationLinks from '~/vue_shared/components/pagination_links.vue';
import GroupsComponent from '~/groups/components/groups.vue';
import eventHub from '~/groups/event_hub';
import { VISIBILITY_LEVEL_PRIVATE_STRING } from '~/visibility_level/constants';
import { mockGroups, mockPageInfo } from '../mock_data';

describe('GroupsComponent', () => {
  let wrapper;

  const defaultPropsData = {
    groups: mockGroups,
    pageInfo: mockPageInfo,
  };

  const createComponent = ({ propsData } = {}) => {
    wrapper = mountExtended(GroupsComponent, {
      propsData: {
        ...defaultPropsData,
        ...propsData,
      },
      provide: {
        currentGroupVisibility: VISIBILITY_LEVEL_PRIVATE_STRING,
      },
    });
  };

  const findPaginationLinks = () => wrapper.findComponent(PaginationLinks);

  beforeEach(async () => {
    Vue.component('GroupFolder', GroupFolderComponent);
    Vue.component('GroupItem', GroupItemComponent);
  });

  describe('methods', () => {
    describe('change', () => {
      it('should emit `fetchPage` event when page is changed via pagination', () => {
        createComponent();

        jest.spyOn(eventHub, '$emit').mockImplementation();

        findPaginationLinks().props('change')(2);

        expect(eventHub.$emit).toHaveBeenCalledWith('fetchPage', {
          page: 2,
          archived: null,
          filterGroupsBy: null,
          sortBy: null,
        });
      });
    });
  });

  describe('template', () => {
    it('should render component template correctly', () => {
      createComponent();

      expect(wrapper.findComponent(GroupFolderComponent).exists()).toBe(true);
      expect(findPaginationLinks().exists()).toBe(true);
      expect(wrapper.findComponent(GlEmptyState).exists()).toBe(false);
    });
  });
});
