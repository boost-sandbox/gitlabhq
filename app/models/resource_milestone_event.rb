# frozen_string_literal: true

class ResourceMilestoneEvent < ResourceTimeboxEvent
  belongs_to :milestone

  scope :include_relations, -> { includes(:user, milestone: [:project, :group]) }

  # state is used for issue and merge request states.
  enum state: Issue.available_states.merge(MergeRequest.available_states)

  def milestone_title
    milestone&.title
  end

  def milestone_parent
    milestone&.parent
  end

  def synthetic_note_class
    MilestoneNote
  end
end
