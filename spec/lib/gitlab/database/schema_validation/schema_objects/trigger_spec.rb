# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Gitlab::Database::SchemaValidation::SchemaObjects::Trigger, feature_category: :database do
  let(:statement) { 'CREATE TRIGGER my_trigger BEFORE INSERT ON todos FOR EACH ROW EXECUTE FUNCTION trigger()' }
  let(:name) { 'my_trigger' }

  include_examples 'schema objects assertions for', 'create_trig_stmt'
end
