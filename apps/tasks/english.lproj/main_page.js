// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI sc_static*/

sc_require('core');
sc_require('mixins/localized_label');
sc_require('views/logo');
sc_require('views/summary');

/** @namespace

  This page lays out the Tasks application user interface.
  
  @extends SC.Object
  @author Suvajit Gupta
  @author Joshua Holt
*/

Tasks.mainPage = SC.Page.design({

  mainPane: SC.MainPane.design({
    
    layerId: 'mainPane',
    childViews: 'topBarView masterDetailView bottomBarView'.w(),
    
    topBarView: SC.View.design(SC.Border, {
      layout: { top: 2, left: 0, right: 0, height: 43 },
      classNames: ['title-bar'],
      childViews: 'tasksLogo installationLogo userNameLabel displayModeSegments userSelectionField userSelectionCancelButton filterPanelButton filterCancelButton tasksSearchField tasksSearchCancelButton'.w(),
      
      tasksLogo: Tasks.LogoView.design({
        layout: { left: 5, width: 145, top: 0, height: 24 }
      }),

      installationLogo: SC.View.design({
        layout: { left: 155, width: document.title.match(/Dev|Greenhouse/)? 32: 140, centerY: -1, height: 32 },
        tagName: 'img',
        render: function(context, firstTime) {
          if(document.title.match(/Dev/)) {
            context.attr('src', sc_static('images/dev-logo.jpg'));
          }
          else if(document.title.match(/Demo/)) {
            context.attr('src', sc_static('images/demo-logo.png'));
          }
          else if(document.title.match(/Greenhouse/)) {
            context.attr('src', sc_static('images/greenhouse-logo.png'));
          }
          else if(document.title.match(/SproutCore/)) {
            context.attr('src', sc_static('images/sproutcore-logo.png'));
          }
        }
      }),

      userNameLabel: SC.LabelView.design(SCUI.ToolTip, {
        layout: { bottom: 2, left: 0, width: 150, height: 16 },
        valueBinding: SC.Binding.transform(function(value, binding) {
          return value? ("_Hi".loc() + value) : '';
        }).from('CoreTasks*currentUser.name'),
        classNames: ['user-name-message']
      }),

      displayModeSegments: SC.SegmentedView.design(SCUI.ToolTip, {
        layout: { centerY: 0, centerX: -90, height: 24, width: 145},
        classNames: ['display-modes'],
        items: [
          { title: "_Tasks".loc(), icon: 'tasks-icon', value: Tasks.DISPLAY_MODE_TASKS },
          { title: "_Team".loc(), icon: 'sc-icon-group-16', value: Tasks.DISPLAY_MODE_TEAM }
        ],
        itemTitleKey: 'title',
        // itemIconKey: 'icon', // disabling icons for now - appearing too cluttered
        itemValueKey: 'value',
        toolTip: "_DisplayModeTooltip".loc(),
        valueBinding: 'Tasks.assignmentsController.displayMode'
      }),

      userSelectionField: SC.TextFieldView.design(SCUI.ToolTip, {
        layout: { centerY: 0, height: 24, right: 280, width: 200 },
        classNames: ['user-selection-bar'],
        hint: "_UserSelectionHint".loc(),
        toolTip: "_UserSelectionTooltip".loc(),
        valueBinding: 'Tasks.assignmentsController.userSelection'
      }),
      userSelectionCancelButton: SC.View.design({ // Assignee/Submitter selection cancel button
        layout: { centerY: 1, height: 12, right: 285, width: 12 },
        isVisible: NO,
        classNames: ['filter-cancel-icon'],
        mouseDown: function() {
          Tasks.assignmentsController.set('userSelection', '');
        },
        isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.userSelection').bool()
      }),
    
      filterPanelButton: SC.LabelView.design(SCUI.SimpleButton,{
        layout: { centerY: 0, right: 202, height: 18, width: 50 },
        icon: 'filter-icon',
        classNames: ['toolbar-label', 'filter-label'],
        value: "_Filter".loc(),
        toolTip: "_FilterTooltip".loc(),
        target: 'Tasks',
        action: 'filterTasks'
      }),
      filterCancelButton: SC.View.design({ // Filter cancel button
        layout: { centerY: 1, height: 12, right: 212, width: 12 },
        isVisible: NO,
        classNames: ['filter-cancel-icon'],
        mouseDown: function() {
          Tasks.assignmentsController.clearAttributeFilter();
          Tasks.assignmentsController.showAssignments();
        },
        isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.attributeFilterEnabled').bool()
      }),
    
      tasksSearchField: SC.TextFieldView.design(SCUI.ToolTip, {
        layout: { centerY: 0, height: 24, right: 5, width: 200 },
        classNames: ['tasks-search-bar'],
        hint: "_TasksSearchHint".loc(),
        toolTip: "_TasksSearchTooltip".loc(),
        valueBinding: 'Tasks.assignmentsController.searchFilter'
      }),
      tasksSearchCancelButton: SC.View.design({ // Tasks Search cancel button
        layout: { centerY: 1, height: 12, right: 10, width: 12 },
        isVisible: NO,
        classNames: ['filter-cancel-icon'],
        mouseDown: function() {
          Tasks.assignmentsController.set('searchFilter', '');
        },
        isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.searchFilter').bool()
      })
                             
      // TODO: [SG] convert all of these to a drop-down actions menu
      
      // notificationsCheckbox: SC.CheckboxView.design(SCUI.ToolTip, {
      //   layout: { centerY: 0, height: 16, right: 350, width: 90 },
      //   classNames: ['status-bar-label'],
      //   textAlign: SC.ALIGN_RIGHT,
      //   // isVisible: NO,
      //   isVisibleBinding: SC.binding('CoreTasks*canServerSendNotifications'),
      //   title: "_SendNotifications".loc(),
      //   toolTip: "_SendNotificationsTooltip".loc(),
      //   valueBinding: 'CoreTasks.shouldNotify'
      // }),
      // 
      // autoSaveCheckbox: SC.CheckboxView.design(SCUI.ToolTip, {
      //   layout: { centerY: 0, height: 16, right: 260, width: 75 },
      //   classNames: ['status-bar-label'],
      //   textAlign: SC.ALIGN_RIGHT,
      //   title: "_AutoSave".loc(),
      //   toolTip: "_AutoSaveTooltip".loc(),
      //   valueBinding: 'CoreTasks.autoSave'
      // }),
      // 
      // statisticsButton: SC.LabelView.design( SCUI.SimpleButton, {
      //   layout: { centerY: 0, height: 16, left: 220, width: 90 },
      //   titleMinWidth: 0,
      //   classNames: ['status-bar-button'],
      //   value: "_ShowStatistics".loc(),
      //   icon: 'statistics-icon',
      //   toolTip: "_ShowStatisticsTooltip".loc(),
      //   isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController*arrangedObjects.length').bool(),
      //   target: 'Tasks',
      //   action: 'projectStatistics'
      // }),
      // 
      // importButton: SC.LabelView.design( SCUI.SimpleButton, {
      //   layout: { centerY: 0, right: 235, height: 32, width: 60 },
      //   icon: ['import-icon'],
      //   toolTip: "_ImportTooltip".loc(),
      //   target: 'Tasks',
      //   action: 'importData'
      // }),
      // 
      // exportButton: SC.LabelView.design( SCUI.SimpleButton, {
      //   layout: { centerY: 0, right: 180, height: 32, width: 32 },
      //   classNames: ['export-icon'],
      //   toolTip: "_ExportTooltip".loc(),
      //   target: 'Tasks.exportDataController',
      //   action: 'selectExportDataFormat'
      // }),
      // 
      // settingsButton: SC.LabelView.design( SCUI.SimpleButton, {
      //   layout: { centerY: 0, right: 110, height: 32, width: 32 },
      //   classNames: ['settings-icon'],
      //   toolTip: "_SettingsTooltip".loc(),
      //   target: 'Tasks',
      //   action: 'settings'
      // }),
      // 
      // helpButton: SC.LabelView.design( SCUI.SimpleButton, {
      //   layout: { centerY: 0, right: 55, height: 32, width: 32 },
      //   classNames: ['help-icon'],
      //   toolTip: "_HelpTooltip".loc(),
      //   target: 'Tasks',
      //   action: 'help'
      // }),
      // 
      // logoutButton: SC.LabelView.design( SCUI.SimpleButton, {
      //   layout: { centerY: 0, right: 5, height: 32, width: 32 },
      //   classNames: ['logout-icon'],
      //   toolTip: "_LogoutTooltip".loc(),
      //   target: 'Tasks',
      //   action: 'logout'
      // })
        
    }),
    
    userName: SC.outlet('topBarView.userNameLabel'),
    
    masterDetailView: SC.View.design({
      layout: { top: 45, bottom: 24, left: 0, right: 0 },
      childViews: 'projectsMasterView tasksDetailView'.w(),
      
      projectsMasterView: SC.ScrollView.design({
        layout: { top: 0, bottom: 0, left: 0, width: 238 },
        hasHorizontalScroller: NO,
        classNames: ['projects-pane'],

        contentView: Tasks.SourceListView.design({
          layout: { top: 0, left:0, bottom: 0, right: 0 },
          contentValueKey: 'displayName',
          contentUnreadCountKey: 'displayTimeLeft',
          contentBinding: 'Tasks.sourcesController.arrangedObjects',
          selectionBinding: 'Tasks.projectsController.selection',
          localize: YES,
          rowHeight: 24,
          classNames: ['projects-pane-inner'],
          hasContentIcon: YES,
          contentIconKey: 'icon',
          exampleView: Tasks.ProjectItemView,
          isEditable: YES,
          canEditContent: YES,
          canReorderContent: YES,
          canDeleteContent: YES,
          destroyOnRemoval: YES,
          delegate: Tasks.reallocationController                
        })
      }),
      
      tasksDetailView: SC.ScrollView.design({
        layout: { top: 0, bottom: 0, left: 238, right: 0 },
        hasHorizontalScroller: NO,
        classNames: ['tasks-pane'],

        contentView: Tasks.SourceListView.design({
          layout: { top: 0, bottom: 0, left: 0, right: 0 },
          contentValueKey: 'displayName',
          contentUnreadCountKey: 'displayEffort',
          contentBinding: 'Tasks.tasksController.arrangedObjects',
          selectionBinding: 'Tasks.tasksController.selection',
          localize: YES,
          rowHeight: 24,
          classNames: ['tasks-pane-inner'],
          hasContentIcon: Tasks.softwareMode,
          contentIconKey: 'icon',
          exampleView: Tasks.TaskItemView,
          groupExampleView: Tasks.AssigneeItemView,
          isEditable: YES,
          canEditContent: YES,
          canReorderContent: YES,
          canDeleteContent: YES,
          destroyOnRemoval: YES,
          delegate: Tasks.reassignmentController,
          selectOnMouseDown: YES,
          
          /* Helper image display logic:
              No projects selected - "select project" helper
            	Single project selected:
            	  if project has no tasks:
            		  addTask enabled - "add tasks tasks" helper
              		else - "display mode" helper
              	else project has tasks
          		    if no tasks filtering through - "adjust filter" helper
            	Multiple projects selected
            		if projects have tasks:
            		  if no tasks filtering through - "adjust filter" helper
        	*/
          render: function(context, firstTime) {
          	
            // console.log('DEBUG: Tasks Detail render(), editorPoppedUp=' + Tasks.editorPoppedUp);
            if(CoreTasks.loginTime) return;
            var sel = Tasks.projectsController.getPath('selection');
            var selectedProjectsCount = sel? sel.get('length') : 0;
            if(selectedProjectsCount === 0) { // No projects selected
              context.addClass('select-project-helper');
              return;
            }
            else if(selectedProjectsCount === 1) { // Single project selected
              if(sel.getPath('firstObject.tasks.length') === 0) { // Project has no tasks
                if(Tasks.tasksController.isAddable()) context.addClass('add-tasks-helper');
                else context.addClass('display-mode-helper');
                return;
              }
              else { // Project has tasks
                if(this.getPath('content.length') === 0) { // No tasks filtering through
                  context.addClass('adjust-filter-helper');
                  return;
                }
              }
            }
            else { // Multiple projects selected
              var tasksCount = 0;
              var ctx = {};
              for (var i = 0; i < selectedProjectsCount; i++) {
                var project = sel.nextObject(i, null, ctx);
                tasksCount += project.getPath('tasks.length');
              }
              if(tasksCount > 0) { // Projects have tasks
                if(this.getPath('content.length') === 0) { // No tasks filtering through
                  context.addClass('adjust-filter-helper');
                  return;
                }
              }
            }
            
            // Remove helper images (if any) and render tasks
            context.removeClass('add-tasks-helper');
            context.removeClass('display-mode-helper');
            context.removeClass('adjust-filter-helper');
            sc_super();
          }
                    
        })
        
        // ..........................................................
        // Hot Key Code - disabled for now owing to conflicts with browser shortcuts
        // keyDown: function(evt) {
        //   var ret, commandCode = evt.commandCodes();
        // 
        //   if(commandCode[0] === 'ctrl_s'){  //ctrl-s
        //     Tasks.saveData();
        //     ret = YES;
        //   }
        //   else if (commandCode[0] === 'ctrl_t'){  //ctrl-t
        //     Tasks.addTask();
        //     ret = YES;
        //   }
        //   else if (commandCode[0] === 'ctrl_d'){  //ctrl-d
        //     Tasks.duplicateTask();
        //     ret = YES;
        //   }
        //   else if (commandCode[0] === 'ctrl_p'){  //ctrl-p
        //     Tasks.addProject();
        //     ret = YES;
        //   }
        //   else{
        //     ret = this.interpretKeyEvents(evt) ;
        //   }
        //   return ret;
        // }
        
      })
        
    }),

    projectsList: SC.outlet('masterDetailView.projectsMasterView.contentView'),
    tasksList: SC.outlet('masterDetailView.tasksDetailView.contentView'),
    
    bottomBarView: SC.View.design(SC.Border, {
      layout: { bottom: 0, height: 24, left: 0, right: 0 },
      classNames: ['status-bar'],
      childViews: 'addProjectButton deleteProjectButton selectionView divider addTaskButton deleteTaskButton summaryView serverMessageView refreshButton saveButton'.w(),
      borderStyle: SC.BORDER_TOP,
        
      addProjectButton: SC.LabelView.design(SCUI.SimpleButton,{
        layout: { centerY: 0, left: 7, height: 16, width: 16 },
        icon: 'add-icon',
        classNames: ['toolbar-label'],
        toolTip: "_AddProjectTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canCreateProject',
        target: 'Tasks',
        action: 'addProject'
      }),
      deleteProjectButton: SC.LabelView.design(SCUI.SimpleButton,{
        layout: { centerY: 0, left: 33, height: 16, width: 16 },
        icon: 'delete-icon',
        classNames: ['toolbar-label'],
        toolTip: "_DeleteProjectTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canDeleteProject',
        isEnabledBinding: 'Tasks.projectsController.isDeletable',
        target: 'Tasks',
        action: 'deleteProject'
      }),
      
      selectionView: Tasks.SelectionView.design({
        layout: { centerY: 0, height: 16, left: 57, width: 220 },
        classNames: ['status-bar-label'],
        textAlign: SC.ALIGN_LEFT,
        projectsSelectionBinding: SC.Binding.oneWay('Tasks.projectsController.selection'),
        tasksSelectionBinding: SC.Binding.oneWay('Tasks.tasksController.selection')
      }),
        
      divider: SC.View.design({
        layout: { centerY: 0, height: 16, left: 228, width: 2 },
        classNames: ['divider']
      }),
      
      addTaskButton: SC.LabelView.design(SCUI.SimpleButton,{
        layout: { centerY: 0, left: 237, height: 16, width: 16 },
        icon: 'add-icon',
        toolTip: "_AddTaskTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canCreateTask',
        isEnabledBinding: 'Tasks.tasksController.isAddable',
        target: 'Tasks',
        action: 'addTask'
      }),
      deleteTaskButton: SC.LabelView.design(SCUI.SimpleButton,SCUI.Permissible,{
        layout: { centerY: 0, left: 262, height: 16, width: 16 },
        icon: 'delete-icon',
        toolTip: "_DeleteTaskTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canDeleteTask',
        isEnabledBinding: SC.Binding.logicalAnd('Tasks.tasksController.isDeletable', 'Tasks.tasksController.notGuestOrGuestSubmittedTasks'),
        isPermittedBinding: 'Tasks.tasksController.notGuestOrGuestSubmittedTasks',
        target: 'Tasks',
        action: 'deleteTask'
      }),
      
      summaryView: Tasks.SummaryView.design({
        layout: { centerY: 0, height: 16, left: 290, width: 250 },
        classNames: ['status-bar-label'],
        displayModeBinding: SC.Binding.oneWay('Tasks.assignmentsController.displayMode'),
        tasksTreeBinding: SC.Binding.oneWay('Tasks.tasksController.content')
      }),
        
      serverMessageView: SC.LabelView.design({
        layout: { centerY: 0, height: 16, right: 55, width: 250 },
        classNames: ['status-bar-label'],
        icon: '',
        textAlign: SC.ALIGN_RIGHT,
        value: ''
      }),

      refreshButton: SC.LabelView.design( SCUI.SimpleButton, {
        layout: { centerY: 0, height: 16, right: 30, width: 16 },
        icon: 'refresh-icon',
        toolTip: "_RefreshTooltip".loc(),
        target: 'Tasks',
        action: 'refreshData'
      }),
      saveButton: SC.LabelView.design( SCUI.SimpleButton, {
        layout: { centerY: 0, height: 16, right: 7, width: 16 },
        icon: 'save-icon',
        toolTip: "_SaveTooltip".loc(),
        isEnabledBinding: 'CoreTasks.needsSave',
        isVisibleBinding: SC.Binding.transform(function(value, binding) {
                                                 return !value;
                                               }).from('CoreTasks.autoSave'),
        target: 'Tasks',
        action: 'saveData'
      })
            
    }),
    
    serverMessage: SC.outlet('bottomBarView.serverMessageView')
    
  })
});
