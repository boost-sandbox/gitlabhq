# frozen_string_literal: true

module QA
  module Support
    module Page
      module Logging
        using Rainbow

        def assert_no_element(name)
          log("asserting no element :#{name}")

          super
        end

        def refresh(skip_finished_loading_check: false)
          log("refreshing #{current_url}", :info)

          super
        end

        def scroll_to(selector, text: nil)
          msg = "scrolling to :#{highlight_element(selector)}"
          msg += " with text: #{text}" if text
          log(msg, :info)

          super
        end

        def asset_exists?(url)
          exists = super

          log("asset_exists? #{url} returned #{exists}")

          exists
        end

        def find_element(name, **kwargs)
          log("finding :#{name} with args #{kwargs}")

          element = super

          log("found :#{name}")

          element
        end

        def all_elements(name, **kwargs)
          log("finding all :#{name} with args #{kwargs}")

          elements = super

          log("found #{elements.size} :#{name}") if elements

          elements
        end

        def check_element(name, click_by_js = false, **kwargs)
          log_by_js("checking", name, click_by_js, **kwargs)

          super
        end

        def uncheck_element(name, click_by_js = false, **kwargs)
          log_by_js("unchecking", name, click_by_js, **kwargs)

          super
        end

        def log_by_js(action, name, click_by_js, **kwargs)
          msg = action
          msg += " via JS" if click_by_js
          msg += " :#{highlight_element(name)} with args #{kwargs}"
          log(msg, :info)
        end

        def click_element_coordinates(name, **kwargs)
          log(%(clicking the coordinates of :#{highlight_element(name)}), :info)

          super
        end

        # @param name [Symbol] name of the data_qa_selector element
        # @param page [Class] a target page class to check existence of (class must inherit from QA::Page::Base)
        # @param kwargs [Hash] keyword arguments to pass to Capybara finder
        def click_element(name, page = nil, **kwargs)
          msg = ["clicking :#{highlight_element(name)}"]
          msg << "and ensuring #{page} is present" if page

          log(msg.join(' '), :info)
          log("with args #{kwargs}")

          super
        end

        def act_via_capybara(method, locator, **kwargs)
          log("acting via capybara using '#{method}(#{locator})' with args #{kwargs}", :info)

          super
        end

        def fill_element(name, content)
          masked_content = name.to_s.match?(/token|key|password/) ? '*****' : content

          log(%(filling :#{highlight_element(name)} with "#{masked_content}"), :info)

          super
        end

        def select_element(name, value)
          log(%(selecting "#{value}" in :#{highlight_element(name)}), :info)

          super
        end

        def has_element?(name, **kwargs)
          found = super

          log_has_element_or_not('has_element?', name, found, **kwargs)

          found
        end

        def has_no_element?(name, **kwargs)
          found = super

          log_has_element_or_not('has_no_element?', name, found, **kwargs)

          found
        end

        def has_text?(text, **kwargs)
          found = super

          log(%(has_text?('#{text}', wait: #{kwargs[:wait] || Capybara.default_max_wait_time}) returned #{found}))

          found
        end

        def has_no_text?(text, **kwargs)
          found = super

          log(%(has_no_text?('#{text}', wait: #{kwargs[:wait] || Capybara.default_max_wait_time}) returned #{found}))

          found
        end

        def finished_loading?(wait: QA::Support::Repeater::DEFAULT_MAX_WAIT_TIME)
          log('waiting for loading to complete...')
          now = Time.now

          loaded = super

          log("loading complete after #{Time.now - now} seconds")

          loaded
        end

        def wait_for_animated_element(name)
          log("waiting for animated element: #{name}")

          super
        end

        def within_element(name, **kwargs)
          log("within element :#{name} with args #{kwargs}")

          element = super

          log("end within element :#{name} with args #{kwargs}")

          element
        end

        def within_element_by_index(name, index)
          log("within elements :#{name} at index #{index}")

          element = super

          log("end within elements :#{name} at index #{index}")

          element
        end

        private

        # Log message
        #
        # @param [String] msg
        # @param [Symbol] level
        # @return [void]
        def log(msg, level = :debug)
          QA::Runtime::Logger.public_send(level, msg)
        end

        # Highlight element for enhanced logging
        #
        # @param [String] element
        # @return [String]
        def highlight_element(element)
          element.to_s.underline.bright
        end

        def log_has_element_or_not(method, name, found, **kwargs)
          msg = ["#{method} :#{name}"]
          msg << %(with text "#{kwargs[:text]}") if kwargs[:text]
          msg << "class: #{kwargs[:class]}" if kwargs[:class]
          msg << "(wait: #{kwargs[:wait] || Capybara.default_max_wait_time})"
          msg << "returned: #{found}"

          log(msg.compact.join(' '))
        end
      end
    end
  end
end
