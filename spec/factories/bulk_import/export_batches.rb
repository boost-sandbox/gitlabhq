# frozen_string_literal: true

FactoryBot.define do
  factory :bulk_import_export_batch, class: 'BulkImports::ExportBatch' do
    association :export, factory: :bulk_import_export

    upload { association(:bulk_import_export_upload) }

    status { 0 }

    trait :started do
      status { 0 }
    end

    trait :finished do
      status { 1 }
    end

    trait :failed do
      status { -1 }
    end
  end
end
