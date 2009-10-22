/**
 * The core object of the Tasks framework.
 *
 * @author Sean Eidemiller
 */
/*globals CoreTasks */
 
CoreTasks = SC.Object.create({

  // The main data store and record sets.
  store: SC.Store.create(),
  allUsers: null,
  allTasks: null,
  allProjects: null,
  
  /**
   * Clear all data from store.
   *
   */
  clearData: function() {
    this.allUsers = null;
    this.allTasks = null;
    this.allProjects = null;
    this.store.reset();
  },


  /**
   * Get user for a given loginName (if it exists).
   *
   * @param {String} user's login name.
   * @returns {Object} user record, if matching one exists, or null.
   */
  getUser: function(loginName) {
    var usersCount = this.allUsers.get('length');
    var matchingUser = null;
    for(var i = 0; i < usersCount; i++) {
      var user = this.allUsers.objectAt(i);
      if(user.get('loginName') === loginName) {
        matchingUser = user;
        break;
      }
    }
    return matchingUser;
  },

  /**
   * Get project for a given name (if it exists).
   *
   * @param {String} project name.
   * @returns {Object) return project of given name if it exists, null otherwise.
   */
  getProject: function(name) {
    var projectsCount = this.allProjects.get('length');
    var matchingProject = null;
    for(var i = 0; i < projectsCount; i++) {
      var project = this.allProjects.objectAt(i);
      if(project.get('name') === name) {
        matchingProject = project;
        break;
      }
    }
    return matchingProject;
  },
  
  // The resource path format for the remote server.
  _resourcePathFormat: 'tasks-server/%@%@%@',

  /*
   * The various modes of operation.
   *
   * OFFLINE_MODE: Entities are retrieved from and persisted to internal fixtures.
   * ONLINE_MODE: Entities are retrieved from and persisted to an actual, external server.
   */
  OFFLINE_MODE: 0,
  ONLINE_MODE: 1,

  // The current mode of operation.
  // TODO: [SE] set Tasks application mode via URL.
  mode: null,

  /*
   * The various modes related to the save mechanism.
   */
  MODE_NOT_SAVING: 0x0001,
  MODE_SAVING: 0x0002,
  MODE_SAVING_USERS: 0x0102,
  MODE_SAVING_PROJECTS: 0x0202,
  MODE_SAVING_TASKS: 0x0302,

  // The current save mode.
  saveMode: 0x0001,

  // The logged in user.
  user: null,

  /**
   * A record array of all projects in the store.
   */
  projects: null,

  /**
   * A special project where all tasks for all projects are grouped.
   *
   * This project exists outside of the store because we don't want it to be persisted.
   */
  allTasksProject: null,

  /**
   * A special project where all unallocated tasks are grouped.
   *
   * This project exists outside of the store because we don't want it to be persisted.
   */
  unallocatedTasksProject: null,

  /**
   * Creates a new record in the store.
   *
   * @param {CoreTasks.Record} recordType The type of the record.
   * @param {Hash} dataHash An optional data hash to seed the new record.
   */
  createRecord: function(recordType, dataHash) {
    if (!dataHash) dataHash = {};

    // Assign the new record a negative integer ID (will be overwritten upon persistence to the
    // server, but certain SC mechanisms require that all records have a primary key).
    if (dataHash.id === undefined) {
      dataHash.id = dataHash._id = this._currentRecordId;
      this._currentRecordId--;
    }

    // Check to see if the record defines a createRecord function (if it does, call it).
    if (recordType.createRecord) {
      return recordType.createRecord(recordType, dataHash);
    } else {
      // Otherwise, call createRecord on the store.
      return this.get('store').createRecord(recordType, dataHash);
    }
  },

  /**
   * See if any changes have been made to the store.
   *
   * @returns {Boolean) return true if store.
   */
   // FIXME: [SG] Beta: see why isStoreDirty is not being recomputed when the changelog length changes
  isStoreDirty: function() {
    // Ignore the two reserved projects added in by the system at startup
    return this.getPath('store.changelog.length') > 2;
  }.property('*store.changelog.length').cacheable(),

  /**
   * A read-only computed property that returns true if a save is currently in progress; false
   * otherwise.
   *
   * @returns {Boolean}
   */
  isSaving: function() {
    return this.get('saveMode') & CoreTasks.MODE_SAVING;
  }.property('saveMode').cacheable(),

  /*
   * Store key arrays of all dirty records, used by the save mechanism to ensure that records are
   * persisted in the correct order.
   *
   * This is less than ideal, but it works.
   */
  _dirtyUsers: [],
  _dirtyProjects: [],
  _dirtyTasks: [],

  /**
   * Persists all new and modified records to the store.
   *
   * Persistence must occur in a precise order to maintain entity associations.
   */
  // FIXME: [SE] Beta: make save work with latest SproutCore
  saveChanges: function() {
    if (this.get('saveMode') & CoreTasks.MODE_SAVING) {
      throw 'Error saving data: Save already in progress.';
    }

    var store = this.get('store'), key, recType, recStatus, records, len, i;

    // Make our intentions known.
    this.set('saveMode', CoreTasks.MODE_SAVING);

    // Clear the arrays just in case.
    this._dirtyUsers = [];
    this._dirtyProjects = [];
    this._dirtyTasks = [];

    // Get the store keys of the two "special" projects that we never want to persist.
    if (!this._allTasksProjectKey) {
      this._allTasksProjectKey = this.getPath('allTasksProject.storeKey');
    }

    if (!this._unallocatedTasksProjectKey) {
      this._unallocatedTasksProjectKey = this.getPath('unallocatedTasksProject.storeKey');
    }

    // Build separate arrays for all dirty records.
    var dirtyRecordKeys = store.changelog;
    len = dirtyRecordKeys ? dirtyRecordKeys.length : 0;

    for (i = 0; i < len; i++) {
      key = dirtyRecordKeys[i];
      recStatus = store.peekStatus(key);
      recType = store.recordTypeFor(key);

      // Short-circuit if status is CLEAN (you can't always trust the changelog).
      if (recStatus & SC.Record.CLEAN && recStatus !== SC.Record.READY_NEW) continue;

      switch (recType) {
        case CoreTasks.User:
          this._dirtyUsers.pushObject(key);
          break;
        case CoreTasks.Project:
          if (key !== this.__allTasksProjectKey && key !== this._unallocatedTasksProjectKey) {
            this._dirtyProjects.pushObject(key);
          }

          break;
        case CoreTasks.Task:
          this._dirtyTasks.pushObject(key);
          break;
      }
    }

    // Now start by persisting all of the dirty users, but only if there are any.
    len = this._dirtyUsers.length;

    if (len > 0) {
      this._saveUsers();
      return;
    }

    // If there were no dirty users, persist the dirty projects.
    len = this._dirtyProjects.length;

    if (len > 0) {
      this._saveProjects();
      return;
    }

    // If there were no dirty users or projects, persist the dirty tasks.
    len = this._dirtyTasks.length;

    if (len > 0) {
      this._saveTasks();
      return; 
    }

    // Apparently there was nothing to persist, which shouldn't ever happen.
    console.log('Nothing new to save.');
    this.set('saveMode', CoreTasks.MODE_NOT_SAVING);
  },

  // User callbacks.

  userCreated: function(storeKey) {
    var user = this.get('store').materializeRecord(storeKey), tasks;

    SC.RunLoop.begin();

    // Update the now-disassociated assigned tasks.
    tasks = user.get('disassociatedAssignedTasks');

    if (tasks && SC.instanceOf(tasks, SC.RecordArray)) {
      tasks.forEach(function(task) {
        task.writeAttribute('assigneeId', user.readAttribute('id'));
      });
    }

    // Update the now-disassociated submitted tasks.
    tasks = user.get('disassociatedSubmittedTasks');

    if (tasks && SC.instanceOf(tasks, SC.RecordArray)) {
      tasks.forEach(function(task) {
        task.writeAttribute('submitterId', user.readAttribute('id'));
      });
    }

    SC.RunLoop.end();

    this._dirtyUsers.removeObject(storeKey);
    this._continueSave();
  },

  userUpdated: function(storeKey) {
    this._dirtyUsers.removeObject(storeKey);
    this._continueSave();
  },

  userDeleted: function(storeKey) {
    this._dirtyUsers.removeObject(storeKey);
    this._continueSave();
  },

  // Project callbacks.

  projectCreated: function(storeKey) {
    var project = this.get('store').materializeRecord(storeKey);

    // Update the now-disassociated tasks.
    SC.RunLoop.begin();
    var tasks = project.get('disassociatedTasks');

    if (tasks && SC.instanceOf(tasks, SC.RecordArray)) {
      tasks.forEach(function(task) {
        task.writeAttribute('projectId', project.readAttribute('id'));
      });
    }

    SC.RunLoop.end();

    this._dirtyProjects.removeObject(storeKey);
    this._continueSave();
  },

  projectUpdated: function(storeKey) {
    this._dirtyProjects.removeObject(storeKey);
    this._continueSave();
  },

  projectDeleted: function(storeKey) {
    this._dirtyProjects.removeObject(storeKey);
    this._continueSave();
  },

  // Task callbacks.

  taskCreated: function(storeKey) {
    this._dirtyTasks.removeObject(storeKey);
    this._continueSave();
  },

  taskUpdated: function(storeKey) {
    this._dirtyTasks.removeObject(storeKey);
    this._continueSave();
  },

  taskDeleted: function(storeKey) {
    this._dirtyTasks.removeObject(storeKey);
    this._continueSave();
  },

  _continueSave: function() {
    if (this._dirtyUsers.length === 0) {
      if (this._dirtyProjects.length === 0) {
        if (this._dirtyTasks.length === 0) {
          this.set('saveMode', CoreTasks.MODE_NOT_SAVING);
        } else {
          // Save to start persisting tasks, if we haven't already.
          if (this.get('saveMode') !== CoreTasks.MODE_SAVING_TASKS) {
            this._saveTasks();
          }
        }

      } else {
        // Safe to start persisting projects, if we haven't already.
        if (this.get('saveMode') !== CoreTasks.MODE_SAVING_PROJECTS) {
          this._saveProjects();
        }
      }
    }
  },

  _saveUsers: function() {
    this.set('saveMode', CoreTasks.MODE_SAVING_USERS);
    this.get('store').commitRecords(CoreTasks.User, undefined, SC.clone(this._dirtyUsers));
  },

  _saveProjects: function() {
    this.set('saveMode', CoreTasks.MODE_SAVING_PROJECTS);
    this.get('store').commitRecords(CoreTasks.Project, undefined, SC.clone(this._dirtyProjects));
  },

  _saveTasks: function() {
    this.set('saveMode', CoreTasks.MODE_SAVING_TASKS);
    this.get('store').commitRecords(CoreTasks.Task, undefined, SC.clone(this._dirtyTasks));
  },

  /**
   * Computes the full path component of the URL given a resource name and an optional ID.
   *
   * @param {String} resourceName The name of the resource (ex. 'project').
   * @param {String} id The ID of the entity (optional).
   * @param {Hash} queryParams Query parameters to append (optional).
   *
   * @returns {String} The full path component of the URL.
   */
  getFullResourcePath: function(resourceName, id, queryParams) {
    var params = '';
    id = id ? '/' + id : '';

    if (queryParams) {
      var i = 0;

      for (var key in queryParams) {
        if (queryParams.hasOwnProperty(key)) {
          params += '%@%@=%@'.fmt(i === 0 ? '?' : '&', key, queryParams[key]);
          i++;
        }
      }
    }

    return this._resourcePathFormat.fmt(resourceName, id, params);
  },

  /**
   * Display time with 'd' appended if no time unit present.
   *
   * @param (String) time in days or hours
   * @returns {String) return time with unit appended.
   */
  displayTime: function(time) {
    if(SC.none(time)) return null;
    var lastChar = time[time.length-1];
    return time + ((lastChar === 'd' || lastChar === 'h')? '' : 'd');
  },
  
  /**
   * Extract time unit (if specified).
   *
   * @param (String) time in days or hours
   * @returns {String) return time unit (if specified) or the empty string ''.
   */
  getTimeUnit: function(time) {
    if(SC.none(time)) return '';
    var lastChar = time[time.length-1];
    return (lastChar === 'd' || lastChar === 'h')? lastChar : '';
  },
  
  /**
   * Convert time into days using time unit if available (assumed 'd' otherwise)
   *
   * @param (String) time in days or hours
   */
  convertTimeToDays: function(time) {
    if(SC.none(time)) return 0;
    var lastChar = time[time.length-1];
    var ret;
    if(lastChar === 'd') ret = time.slice(0, time.length-1); // already in days, remove time unit
    else if(lastChar === 'h') ret = time.slice(0, time.length-1)/8; // asssumes 8h days, convert, remove time unit
    else ret = time; // already number of days
    return parseFloat(parseFloat(ret, 10).toFixed(3));
  },

  // Used to assign all newly-created records with a negative ID.
  // TODO: [SE] reset the counter so that we don't run out of integers if the client is left
  // running for a very long time.
  _currentRecordId: -1

});

// Add the bind() function to the Function prototype.
SC.mixin(Function.prototype, {

  /**
   * This bind method was ported from the prototype for use in the AJAX callbacks.
   *
   *  Function#bind(object[, args...]) -> Function
   *  - object (Object): The object to bind to.
   *
   *  Wraps the function in another, locking its execution scope to an object
   *  specified by `object`.
   */
  bind: function (context) {
    var slice = Array.prototype.slice;

    var update = function(array, args) {
      var arrayLength = array.length, length = args.length;
      while (length--) array[arrayLength + length] = args[length];
      return array;
    };

    var merge = function(array, args) {
      array = slice.call(array, 0);
      return update(array, args);
    };

    if (arguments.length < 2 && SC.none(arguments[0])) return this;
    var __method = this, args = slice.call(arguments, 1);

    return function() {
      var a = merge(args, arguments);
      // var a = args.concat(arguments);
      return __method.apply(context, a);
    };
  }
    
});

// Set the mode of operation.
//CoreTasks.set('mode', CoreTasks.get('OFFLINE_MODE'));
CoreTasks.set('mode', CoreTasks.get('ONLINE_MODE'));
