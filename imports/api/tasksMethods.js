import { check } from 'meteor/check';
import { TasksCollection } from '/imports/db/TasksCollection';

Meteor.methods({
  async 'tasks.insert'(text, category) {
    check(text, String);
    check(category, String);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.');
    }

    const lastTask = await TasksCollection.findOneAsync({}, { sort: { order: -1 } });
    const nextOrder = lastTask ? (lastTask.order || 0) + 1 : 0;

    await TasksCollection.insertAsync({
      text,
      category,
      createdAt: new Date(),
      userId: this.userId,
      order: nextOrder,
    });
  },

  async 'tasks.remove'(taskId) {
    check(taskId, String);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.');
    }

    const task = await TasksCollection.findOneAsync({ _id: taskId, userId: this.userId });

    if (!task) {
      throw new Meteor.Error('Access denied.');
    }

    await TasksCollection.removeAsync(taskId);
  },

  async 'tasks.setIsChecked'(taskId, isChecked) {
    check(taskId, String);
    check(isChecked, Boolean);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.');
    }

    const task = await TasksCollection.findOneAsync({ _id: taskId, userId: this.userId });

    if (!task) {
      throw new Meteor.Error('Access denied.');
    }

    await TasksCollection.updateAsync(taskId, {
      $set: { isChecked },
    });
  },

  async 'tasks.reorder'(orderedIds) {
    check(orderedIds, [String]);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.');
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        TasksCollection.updateAsync(id, { $set: { order: index } })
      )
    );
  },
});