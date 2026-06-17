import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { TasksCollection } from '/imports/db/TasksCollection';
import '/imports/api/tasksMethods';
import '/imports/api/tasksPublications';

const insertTask = (taskText, user) =>
  TasksCollection.insertAsync({
    text: taskText,
    category: 'other',
    userId: user._id,
    createdAt: new Date(),
    order: 0,
  });

const SEED_USERNAME = 'meteorite';
const SEED_PASSWORD = 'password';

Meteor.startup(async () => {
  if (!(await Accounts.findUserByUsername(SEED_USERNAME))) {
    await Accounts.createUser({
      username: SEED_USERNAME,
      password: SEED_PASSWORD,
    });
  }

  const user = await Accounts.findUserByUsername(SEED_USERNAME);

  if ((await TasksCollection.find().countAsync()) === 0) {
    await Promise.all(
      ['First Task', 'Second Task', 'Third Task'].map(taskText =>
        insertTask(taskText, user)
      )
    );
  }
});