# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'Work item', :js, feature_category: :team_planning do
  let_it_be(:project) { create(:project, :public) }
  let_it_be(:user) { create(:user) }
  let_it_be(:work_item) { create(:work_item, project: project) }
  let_it_be(:milestone) { create(:milestone, project: project) }
  let_it_be(:milestones) { create_list(:milestone, 25, project: project) }
  let(:work_items_path) { project_work_items_path(project, work_items_path: work_item.iid, iid_path: true) }

  context 'for signed in user' do
    before do
      project.add_developer(user)

      sign_in(user)

      visit work_items_path
    end

    it 'uses IID path in breadcrumbs' do
      within('[data-testid="breadcrumb-current-link"]') do
        expect(page).to have_link('Work Items', href: work_items_path)
      end
    end

    it_behaves_like 'work items title'
    it_behaves_like 'work items status'
    it_behaves_like 'work items assignees'
    it_behaves_like 'work items labels'
    it_behaves_like 'work items comments', :issue
    it_behaves_like 'work items description'
    it_behaves_like 'work items milestone'
  end

  context 'for signed in owner' do
    before do
      project.add_owner(user)

      sign_in(user)

      visit work_items_path
    end

    it_behaves_like 'work items invite members'
  end
end
