import Vue from 'vue';
import VueApollo from 'vue-apollo';
import { mount } from '@vue/test-utils';
import { GlDisclosureDropdown, GlDisclosureDropdownItem, GlModal } from '@gitlab/ui';
import { __ } from '~/locale';
import createMockApollo from 'helpers/mock_apollo_helper';
import { createMockDirective } from 'helpers/vue_mock_directive';
import ListItem from '~/saved_replies/components/list_item.vue';
import deleteSavedReplyMutation from '~/saved_replies/queries/delete_saved_reply.mutation.graphql';

function createMockApolloProvider(requestHandlers = [deleteSavedReplyMutation]) {
  Vue.use(VueApollo);

  return createMockApollo([requestHandlers]);
}

describe('Saved replies list item component', () => {
  let wrapper;
  let $router;

  function createComponent(propsData = {}, apolloProvider = createMockApolloProvider) {
    $router = {
      push: jest.fn(),
    };

    return mount(ListItem, {
      propsData,
      directives: {
        GlModal: createMockDirective('gl-modal'),
      },
      apolloProvider,
      mocks: {
        $router,
      },
    });
  }

  const findDropdown = () => wrapper.findComponent(GlDisclosureDropdown);
  const findDropdownItems = () => wrapper.findAllComponents(GlDisclosureDropdownItem);
  const findModal = () => wrapper.findComponent(GlModal);

  it('renders list item', async () => {
    wrapper = createComponent({ reply: { name: 'test', content: '/assign_reviewer' } });

    expect(wrapper.element).toMatchSnapshot();
  });

  describe('saved reply actions dropdown', () => {
    beforeEach(() => {
      wrapper = createComponent({ reply: { name: 'test', content: '/assign_reviewer' } });
    });

    it('exists', () => {
      expect(findDropdown().exists()).toBe(true);
    });

    it('has correct toggle text', () => {
      expect(findDropdown().props('toggleText')).toBe(__('Saved reply actions'));
    });

    it('has correct amount of dropdown items', () => {
      const items = findDropdownItems();

      expect(items.exists()).toBe(true);
      expect(items).toHaveLength(2);
    });

    describe('edit option', () => {
      it('exists', () => {
        const items = findDropdownItems();

        const editItem = items.filter((item) => item.text() === __('Edit'));

        expect(editItem.exists()).toBe(true);
      });

      it('shows as first dropdown item', () => {
        const items = findDropdownItems();

        expect(items.at(0).text()).toBe(__('Edit'));
      });
    });

    describe('delete option', () => {
      it('exists', () => {
        const items = findDropdownItems();

        const deleteItem = items.filter((item) => item.text() === __('Delete'));

        expect(deleteItem.exists()).toBe(true);
      });

      it('shows as first dropdown item', () => {
        const items = findDropdownItems();

        expect(items.at(1).text()).toBe(__('Delete'));
      });
    });
  });

  describe('Delete modal', () => {
    let deleteSavedReplyMutationResponse;

    beforeEach(() => {
      deleteSavedReplyMutationResponse = jest
        .fn()
        .mockResolvedValue({ data: { savedReplyDestroy: { errors: [] } } });

      const apolloProvider = createMockApolloProvider([
        deleteSavedReplyMutation,
        deleteSavedReplyMutationResponse,
      ]);

      wrapper = createComponent(
        { reply: { name: 'test', content: '/assign_reviewer', id: 1 } },
        apolloProvider,
      );
    });

    it('exists', () => {
      expect(findModal().exists()).toBe(true);
    });

    it('has correct title', () => {
      expect(findModal().props('title')).toBe(__('Delete saved reply'));
    });

    it('delete button calls Apollo mutate', async () => {
      await findModal().vm.$emit('primary');

      expect(deleteSavedReplyMutationResponse).toHaveBeenCalledWith({ id: 1 });
    });

    it('cancel button does not trigger Apollo mutation', async () => {
      await findModal().vm.$emit('secondary');

      expect(deleteSavedReplyMutationResponse).not.toHaveBeenCalled();
    });
  });

  describe('Dropdown Edit', () => {
    beforeEach(() => {
      wrapper = createComponent({ reply: { name: 'test', content: '/assign_reviewer' } });
    });

    it('click triggers router push', async () => {
      const editComponent = findDropdownItems().at(0);

      await editComponent.find('button').trigger('click');

      expect($router.push).toHaveBeenCalled();
    });
  });
});
