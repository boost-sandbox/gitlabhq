# frozen_string_literal: true

module Gitlab
  module Database
    module SchemaValidation
      class StructureSql
        DEFAULT_SCHEMA = 'public'

        def initialize(structure_file_path, schema_name = DEFAULT_SCHEMA)
          @structure_file_path = structure_file_path
          @schema_name = schema_name
        end

        def index_exists?(index_name)
          indexes.find { |index| index.name == index_name }.present?
        end

        def trigger_exists?(trigger_name)
          triggers.find { |trigger| trigger.name == trigger_name }.present?
        end

        def indexes
          @indexes ||= map_with_default_schema(index_statements, SchemaObjects::Index)
        end

        def triggers
          @triggers ||= map_with_default_schema(trigger_statements, SchemaObjects::Trigger)
        end

        private

        attr_reader :structure_file_path, :schema_name

        def index_statements
          statements.filter_map { |s| s.stmt.index_stmt }
        end

        def trigger_statements
          statements.filter_map { |s| s.stmt.create_trig_stmt }
        end

        def statements
          @statements ||= parsed_structure_file.tree.stmts
        end

        def parsed_structure_file
          PgQuery.parse(File.read(structure_file_path))
        end

        def map_with_default_schema(statements, validation_class)
          statements.map do |statement|
            statement.relation.schemaname = schema_name if statement.relation.schemaname == ''

            validation_class.new(statement)
          end
        end
      end
    end
  end
end
