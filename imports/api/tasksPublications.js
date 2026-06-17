import { Meteor } from 'meteor/meteor';
import { TasksCollection } from '/imports/db/TasksCollection';

Meteor.publish('tasks', function publishTasks() {
  return TasksCollection.find(
    { userId: this.userId },
    { sort: { order: 1, createdAt: -1 } }
  );
});