# frozen_string_literal: true

module Sidebars
  module Groups
    module Menus
      class CiCdMenu < ::Sidebars::Menu
        override :configure_menu_items
        def configure_menu_items
          add_item(runners_menu_item)

          true
        end

        override :title
        def title
          _('CI/CD')
        end

        override :sprite_icon
        def sprite_icon
          'rocket'
        end

        override :pick_into_super_sidebar?
        def pick_into_super_sidebar?
          true
        end

        private

        def runners_menu_item
          return ::Sidebars::NilMenuItem.new(item_id: :runners) unless show_runners?

          ::Sidebars::MenuItem.new(
            title: _('Runners'),
            link: group_runners_path(context.group),
            active_routes: { controller: 'groups/runners' },
            item_id: :runners
          )
        end

        def show_runners?
          can?(context.current_user, :read_group_runners, context.group)
        end
      end
    end
  end
end
