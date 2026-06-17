import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import Sortable from 'sortablejs';

import { TasksCollection } from '/imports/db/TasksCollection';
import './App.html';
import './Task.js';
import './Login.js';

const HIDE_COMPLETED_STRING = "hideCompleted";
const IS_LOADING_STRING = "isLoading";
const CATEGORY_FILTER_STRING = "categoryFilter";

const getUser = () => Meteor.user();
const isUserLogged = () => !!getUser();

Template.mainContainer.onCreated(function mainContainerOnCreated() {
  this.state = new ReactiveDict();
  this.state.set(CATEGORY_FILTER_STRING, 'all');

  const handler = Meteor.subscribe('tasks');
  Tracker.autorun(() => {
    this.state.set(IS_LOADING_STRING, !handler.ready());
  });
});

Template.mainContainer.onRendered(function() {
  const instance = this;

  instance.autorun(() => {
    const loading = instance.state.get(IS_LOADING_STRING);
    const loggedIn = isUserLogged();

    Tracker.afterFlush(() => {
      const listEl = document.getElementById('task-list');
      if (!listEl) return;

      if (instance._sortable) {
        instance._sortable.destroy();
      }

      instance._sortable = Sortable.create(listEl, {
        animation: 150,
        ghostClass: 'task-sortable-ghost',
        onEnd(evt) {
          const items = listEl.querySelectorAll('li[data-id]');
          const orderedIds = Array.from(items).map(el => el.dataset.id);
          Meteor.call('tasks.reorder', orderedIds);
        },
      });
    });
  });
});

Template.mainContainer.onDestroyed(function() {
  if (this._sortable) {
    this._sortable.destroy();
  }
});

Template.mainContainer.helpers({
  tasks() {
    const instance = Template.instance();
    const hideCompleted = instance.state.get(HIDE_COMPLETED_STRING);
    const categoryFilter = instance.state.get(CATEGORY_FILTER_STRING);

    if (!isUserLogged()) return [];

    const user = getUser();
    let filter = { userId: user._id };

    if (hideCompleted) {
      filter.isChecked = { $ne: true };
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filter.category = categoryFilter;
    }

    return TasksCollection.find(filter, {
      sort: { order: 1, createdAt: -1 },
    }).fetch();
  },

  incompleteCount() {
    if (!isUserLogged()) return '';
    const user = getUser();
    const count = TasksCollection.find({
      userId: user._id,
      isChecked: { $ne: true },
    }).count();
    return count ? `(${count})` : '';
  },

  isUserLogged() {
    return isUserLogged();
  },

  getUser() {
    return getUser();
  },

  hideCompleted() {
    return Template.instance().state.get(HIDE_COMPLETED_STRING);
  },

  isLoading() {
    return Template.instance().state.get(IS_LOADING_STRING);
  },

  isAllFilter() {
    return Template.instance().state.get(CATEGORY_FILTER_STRING) === 'all';
  },
  isWorkFilter() {
    return Template.instance().state.get(CATEGORY_FILTER_STRING) === 'work';
  },
  isPersonalFilter() {
    return Template.instance().state.get(CATEGORY_FILTER_STRING) === 'personal';
  },
  isUrgentFilter() {
    return Template.instance().state.get(CATEGORY_FILTER_STRING) === 'urgent';
  },
  isOtherFilter() {
    return Template.instance().state.get(CATEGORY_FILTER_STRING) === 'other';
  },
});

Template.mainContainer.events({
  'click #hide-completed-button'(event, instance) {
    const current = instance.state.get(HIDE_COMPLETED_STRING);
    instance.state.set(HIDE_COMPLETED_STRING, !current);
  },

  'click #filter-all'(event, instance) {
    instance.state.set(CATEGORY_FILTER_STRING, 'all');
  },
  'click #filter-work'(event, instance) {
    instance.state.set(CATEGORY_FILTER_STRING, 'work');
  },
  'click #filter-personal'(event, instance) {
    instance.state.set(CATEGORY_FILTER_STRING, 'personal');
  },
  'click #filter-urgent'(event, instance) {
    instance.state.set(CATEGORY_FILTER_STRING, 'urgent');
  },
  'click #filter-other'(event, instance) {
    instance.state.set(CATEGORY_FILTER_STRING, 'other');
  },

  'click .user'() {
    Meteor.logout();
  },
});

Template.form.events({
  'submit .task-form'(event) {
    event.preventDefault();
    const target = event.target;
    const text = target.text.value.trim();
    const category = target.category.value;

    if (!text) return;

    Meteor.call('tasks.insert', text, category);
    target.text.value = '';
  }
});