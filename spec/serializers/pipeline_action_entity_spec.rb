require 'spec_helper'

describe PipelineActionEntity do
  let(:build) { create(:ci_build, name: 'test_build') }

  let(:entity) do
    described_class.new(build, request: double)
  end

  describe '#as_json' do
    subject { entity.as_json }

    it 'contains humanized build name' do
      expect(subject[:name]).to eq 'Test build'
    end

    it 'contains path to the action play' do
      expect(subject[:path]).to include "builds/#{build.id}/play"
    end
  end
end
