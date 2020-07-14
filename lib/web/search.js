"use strict";

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

import { Button } from "reakit/Button";
import { useCheckboxState, Checkbox } from "reakit/Checkbox";
import { useRadioState, Radio, RadioGroup } from "reakit/Radio";

import {
  useDisclosureState,
  Disclosure,
  DisclosureContent
} from "reakit/Disclosure";

import {
  useDialogState,
  Dialog,
  DialogDisclosure,
  DialogBackdrop
} from "reakit/Dialog";

import {
  usePopoverState,
  Popover,
  PopoverDisclosure,
  PopoverArrow
} from "reakit/Popover";

import { useStateContentLoaded } from "react/handy-hooks";
import { GelIcon, GelIconDisclosure } from "react/gel";
import { InnerHTML } from "react/inner-html";

import { fetchOK, fetchJSON } from "web/fetch";
import { mountLink } from "react/links";
import classNames from "classnames";

const MaybeLink = props =>
  (props.href && <a href={mountLink(props.href)}>{props.children}</a>) || (
    <>{props.children}</>
  );

const Hidden = ({ name, value }) =>
  value && <input type="hidden" defaultValue={value} name={name} />;

function FilterPill(props) {
  const onClick = e => {
    e.preventDefault();
    props.onRemove && props.onRemove();
  };

  const classes = classNames("pill", props.kind, {
    negated: props.opt.negated
  });

  return (
    <div className={classes}>
      <span>
        {props.opt.negated && "Exclude "} {props.displayTag}:
      </span>
      <span>{props.name}</span>
      <Button as="a" onClick={onClick}>
        <GelIcon
          href="core/set/gel-icons-core-set.svg#gel-icon-no"
          title="Remove from search"
          focusable={true}
        />
      </Button>
    </div>
  );
}

function FilterBar(props) {
  return (
    <div className="filter-bar">
      <div className="filters">
        {props.filter.map(d => (
          <FilterPill
            key={d.id}
            onRemove={() => props.onRemove && props.onRemove(d.id)}
            {...d}
          />
        ))}
      </div>
    </div>
  );
}

function wireButtons(handlers) {
  // Install handlers
  for (const h of handlers) {
    if (h.disabled) h.element.classList.add("disabled");
    else h.element.addEventListener("click", h.handler);
  }
  return () => {
    // Uninstall handlers
    for (const h of handlers) {
      if (h.disabled) h.element.classList.remove("disabled");
      else h.element.removeEventListener("click", h.handler);
    }
  };
}

const f2term = f => (f.opt.negated ? "!" : "") + f.id;

function useFilterState(initFilt, onChange) {
  const [filter, setFilterRaw] = useState(initFilt || []);
  const [loaded, setLoaded] = useStateContentLoaded();

  const setFilter = filt => {
    setFilterRaw(filt);
    onChange && onChange(filt);
  };

  const addFilter = async (term, remove = []) => {
    const next = filter.filter(f => !remove.includes(f.id));
    if (term) {
      const url = mountLink("/data/search/description?filt=" + term);
      const search = await fetchJSON(url);
      const id = term.replace(/^!/, "");
      setFilter(next.filter(f => f.id !== id).concat(search.filt));
    } else {
      setFilter(next);
    }
  };

  const removeFilter = (...id) => addFilter(null, id);

  const clearFilters = () => setFilter([]);

  const hasFilter = (id, neg) =>
    filter.some(f => f.id === id && !!f.opt.negated === !!neg);

  // Wire up elements on filter change, page load
  useEffect(() => {
    const elements = document.querySelectorAll(".add-to-search");
    // Make a list of elements and handlers
    const handlers = [...elements].map(element => {
      const term = element.getAttribute("data-id");
      const disabled = !!filter.find(f => f2term(f) === term);
      return {
        element,
        disabled,
        handler: e => addFilter(term)
      };
    });
    return wireButtons(handlers);
  }, [filter, loaded]);

  return { filter, addFilter, removeFilter, clearFilters, hasFilter };
}

function SearchOptions(props) {
  const opt = usePopoverState();
  opt.unstable_popoverStyles = "";
  return (
    <div className="search-criteria">
      <PopoverDisclosure {...opt}>
        {props.label}
        <GelIconDisclosure {...opt} title={props.label} focusable={true} />
      </PopoverDisclosure>
      <Popover {...opt} aria-label={props.label}>
        <div className="panel">{props.children}</div>
      </Popover>
    </div>
  );
}

function FilterButton(props) {
  const { term, exclude, disabled, addFilter, label, icon } = props;
  const classes = classNames("search-filter-button", { exclude, disabled });
  return (
    <Button
      title={label}
      className={classes}
      onClick={e => {
        e.preventDefault();
        addFilter((exclude ? "!" : "") + term);
      }}
    >
      <GelIcon href={"genome/set/genome-icons-set.svg#" + icon} />
    </Button>
  );
}

function FilterIncludeButton(props) {
  return (
    <FilterButton
      {...props}
      label="Add this to your search"
      term={props.id}
      icon="add-to-search"
    />
  );
}

function FilterExcludeButton(props) {
  return (
    <FilterButton
      {...props}
      label="Exclude this from your search"
      term={props.id}
      exclude={true}
      icon="exclude-from-search"
    />
  );
}

function FilterControl(props) {
  const { _id, link, name, icon, addFilter, hasFilter } = props;
  return (
    <li>
      <MaybeLink href={link}>
        {icon && <GelIcon href={icon} title={name} />}
        {name}
      </MaybeLink>
      <FilterExcludeButton
        id={_id}
        addFilter={addFilter}
        disabled={hasFilter(_id, true)}
      />
      <FilterIncludeButton
        id={_id}
        addFilter={addFilter}
        disabled={hasFilter(_id, false)}
      />
    </li>
  );
}

function SearchFilterOptions(props) {
  const { options, addFilter, hasFilter, label } = props;
  return (
    <SearchOptions label={label}>
      <ul>
        {options.map(item => (
          <FilterControl
            key={item._id}
            {...item}
            link={null}
            addFilter={addFilter}
            hasFilter={hasFilter}
          />
        ))}
      </ul>
    </SearchOptions>
  );
}

function useFilterRadioState(filter, addFilter, states) {
  const all = states[0].id;
  const ids = states.map(s => s.id).filter(id => id !== all);
  const state = ids.find(s => filter.some(f => f.id === s)) || all;
  const radio = useRadioState({ state });

  return {
    ...radio,
    state,
    setState: state => {
      radio.setState(state);
      addFilter(state === all ? null : state, ids);
    }
  };
}

function MediaTypeOptions(props) {
  const { filter, addFilter } = props;

  const states = [
    { id: "all", label: "All Programmes" },
    { id: "is_tv", label: "Watch" },
    { id: "is_radio", label: "Listen" }
  ];

  const radio = useFilterRadioState(filter, addFilter, states);

  return (
    <SearchOptions label="Media Type">
      <RadioGroup {...radio} aria-label="Media Type">
        {states.map(info => (
          <label key={info.id}>
            <Radio {...radio} value={info.id} />
            {info.label}
          </label>
        ))}
      </RadioGroup>
    </SearchOptions>
  );
}

function Help() {
  const dialog = useDialogState();
  return (
    <>
      <DialogDisclosure {...dialog} as="a" className="help">
        <GelIcon
          href="core/set/gel-icons-core-set.svg#gel-icon-help"
          title="Help"
          focusable={true}
        />
        Help
      </DialogDisclosure>
      <DialogBackdrop {...dialog} className="help-text-backdrop">
        <Dialog {...dialog} aria-label="Help" className="help-text">
          <div className="close">
            <Button as="a" onClick={dialog.hide} tabIndex="0">
              <GelIcon href="core/set/gel-icons-core-set.svg#gel-icon-no" />
            </Button>
          </div>
          <InnerHTML selector="#search-help" />
        </Dialog>
      </DialogBackdrop>
    </>
  );
}

function Switch(props) {
  console.log(props);
  return (
    <Checkbox {...props} as="div" className="control-switch">
      <div />
    </Checkbox>
  );
}

function Search(props) {
  console.log(props);
  const { description, genreRoot, synthetic } = Object.assign(
    { description: {} },
    props
  );

  const [query, setQuery] = useState(description.q || "");
  const discloseFilters = useDisclosureState({ visible: true });
  const ukSwitch = useCheckboxState();

  const {
    filter,
    addFilter,
    removeFilter,
    clearFilters,
    hasFilter
  } = useFilterState(description.filt, () => discloseFilters.show());

  const resetSearch = () => {
    clearFilters();
    setQuery("");
  };

  const inputChange = e => setQuery(e.target.value);

  const placeholder = filter.length
    ? "Search with the filter below"
    : "What would you like to search for?";

  return (
    <div className="search-box">
      <form id="search" action={mountLink("/search/0/20")}>
        <div className="input-container">
          <input
            type="text"
            value={query}
            onChange={inputChange}
            name="q"
            placeholder={placeholder}
          />
          <Button type="submit">
            <GelIcon
              href="core/set/gel-icons-core-set.svg#gel-icon-search"
              title={placeholder}
              focusable={true}
            />
          </Button>
        </div>

        <div className="filters">
          <div className="toggle-filters">
            <Disclosure {...discloseFilters}>
              <GelIcon
                href="core/set/gel-icons-core-set.svg#gel-icon-filter"
                title="Reset"
                focusable={true}
                className="filter"
              />
              Search Filters
              <GelIconDisclosure
                {...discloseFilters}
                title="View search filters"
                focusable={true}
                className="arrow"
              />
            </Disclosure>
          </div>
        </div>

        <DisclosureContent {...discloseFilters}>
          {() =>
            discloseFilters.visible && (
              <>
                <FilterBar filter={filter} onRemove={removeFilter} />
                <div className="search-options">
                  <div>
                    <MediaTypeOptions filter={filter} addFilter={addFilter} />
                    <SearchFilterOptions
                      label="Genre"
                      options={props.genreRoot}
                      addFilter={addFilter}
                      hasFilter={hasFilter}
                    />

                    <SearchFilterOptions
                      label="Accessibility"
                      options={synthetic.x_accessibility}
                      addFilter={addFilter}
                      hasFilter={hasFilter}
                    />
                  </div>
                </div>
                <div className="form-controls">
                  <div>
                    <Button type="submit" className="apply-filters">
                      Apply Filters
                    </Button>

                    <Button onClick={resetSearch} className="reset" as="a">
                      <GelIcon
                        href="/audio-visual/set/gel-icons-audio-visual-set.svg#gel-icon-replay"
                        title="Reset"
                        focusable={true}
                      />
                      Reset
                    </Button>

                    <Help />
                  </div>
                </div>
              </>
            )
          }
        </DisclosureContent>
        <Hidden name="filt" value={filter.map(f2term).join(",")} />
      </form>
    </div>
  );
}

module.exports = Search;
