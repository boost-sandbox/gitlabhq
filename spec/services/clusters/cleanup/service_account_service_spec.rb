# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Clusters::Cleanup::ServiceAccountService, feature_category: :kubernetes_management do
  describe '#execute' do
    subject { service.execute }

    let!(:service) { described_class.new(cluster) }
    let!(:cluster) { create(:cluster, :cleanup_removing_service_account) }
    let!(:logger) { service.send(:logger) }
    let(:log_meta) do
      {
        service: described_class.name,
        cluster_id: cluster.id,
        execution_count: 0
      }
    end

    let(:kubeclient_instance_double) do
      instance_double(Gitlab::Kubernetes::KubeClient, delete_namespace: nil, delete_service_account: nil)
    end

    before do
      allow_any_instance_of(Clusters::Cluster).to receive(:kubeclient).and_return(kubeclient_instance_double)
    end

    it 'deletes gitlab service account' do
      expect(kubeclient_instance_double).to receive(:delete_service_account)
        .with(
          ::Clusters::Kubernetes::GITLAB_SERVICE_ACCOUNT_NAME,
          ::Clusters::Kubernetes::GITLAB_SERVICE_ACCOUNT_NAMESPACE)

      subject
    end

    it 'logs all events' do
      expect(logger).to receive(:info).with(log_meta.merge(event: :deleting_gitlab_service_account))
      expect(logger).to receive(:info).with(log_meta.merge(event: :destroying_cluster))

      subject
    end

    it 'deletes cluster' do
      expect { subject }.to change { Clusters::Cluster.where(id: cluster.id).exists? }.from(true).to(false)
    end

    context 'when cluster.kubeclient is nil' do
      let(:kubeclient_instance_double) { nil }

      it 'deletes cluster' do
        expect { subject }.to change { Clusters::Cluster.where(id: cluster.id).exists? }.from(true).to(false)
      end
    end

    context 'when there is a Kubeclient::HttpError' do
      ['Unauthorized', 'forbidden', 'Certificate verify Failed'].each do |message|
        before do
          allow(kubeclient_instance_double)
            .to receive(:delete_service_account)
            .and_raise(Kubeclient::HttpError.new(401, message, nil))
        end

        it 'destroys cluster' do
          expect { subject }.to change { Clusters::Cluster.where(id: cluster.id).exists? }.from(true).to(false)
        end
      end
    end
  end
end
