// ==========================================================================
// Tasks.projectsController
// ==========================================================================
/*globals CoreTasks Tasks SCUI */
/** 
  This is the controller for all Projects

  @extends SC.ArrayController
  @author Suvajit Gupta
*/

Tasks.projectsController = SC.ArrayController.create(SCUI.StatusChanged,
/** @scope Tasks.projectsController.prototype */ {
  
  sources: null,
  
  _nameAlphaSort: function(a,b) {
    var aName = a.get('name');
    var bName = b.get('name');
    if(aName === bName) return 0;
    else return aName > bName? 1 : -1;
  },

  showSources: function() {
    
    var projects = this.get('arrangedObjects');
    // console.log('DEBUG: projectsController content changed, editorPoppedUp=' + Tasks.editorPoppedUp + ', projects: ' + projects.getEach('name'));
    Tasks.sourcesRedrawNeeded = true;
    if(Tasks.editorPoppedUp) return;
    
    var nodes = [], systemProjects = [], doneProjects = [], activeProjects = [], plannedProjects = [];
    if(projects) {
      var len = projects.get('length');
      for (var i = 0; i < len; i++) {
        var project = projects.objectAt(i);
        if(CoreTasks.isSystemProject(project)) systemProjects.push(project);
        else {
          switch(project.get('developmentStatus')) {
            case CoreTasks.STATUS_DONE:
              doneProjects.push(project);
              break;
            case CoreTasks.STATUS_ACTIVE:
              activeProjects.push(project);
              break;
            case CoreTasks.STATUS_PLANNED:
              plannedProjects.push(project);
              break;
            default:
              console.error('Project: "' + project.get('name') + '" with illegal development status ' + project.get('developmentStatus'));
              break;
          }
        }
      }
      nodes.push(SC.Object.create({ displayName: "_System".loc() + ' ' + "Projects".loc(), treeItemChildren: systemProjects,
                 treeItemIsExpanded: NO }));
      nodes.push(SC.Object.create({ displayName: doneProjects.length + ' ' + "Projects".loc() + ' ' + CoreTasks.STATUS_DONE.loc(),
                 developmentStatus: CoreTasks.STATUS_DONE, treeItemChildren: doneProjects.sort(this._nameAlphaSort), treeItemIsExpanded: NO }));
      nodes.push(SC.Object.create({ displayName: activeProjects.length + ' ' + "Projects".loc() + ' ' + CoreTasks.STATUS_ACTIVE.loc(),
                 developmentStatus: CoreTasks.STATUS_ACTIVE, treeItemChildren: activeProjects.sort(this._nameAlphaSort), treeItemIsExpanded: YES }));
      nodes.push(SC.Object.create({ displayName: plannedProjects.length + ' ' + "Projects".loc() + ' ' + CoreTasks.STATUS_PLANNED.loc(),
                 developmentStatus: CoreTasks.STATUS_PLANNED, treeItemChildren: plannedProjects.sort(this._nameAlphaSort), treeItemIsExpanded: YES }));
    
    }

    this.set('sources', SC.Object.create({ treeItemChildren: nodes, treeItemIsExpanded: YES }));
    Tasks.sourcesRedrawNeeded = false;
    
  }.observes('[]'),
  
  isDeletable: function() {
    
    if(!CoreTasks.getPath('permissions.canDeleteProject')) return false;
    
    var sel = this.get('selection');
    if(!sel) return false;
    
    var selectedProject = sel.firstObject();
    if(!selectedProject) return false;
    
    if (CoreTasks.isSystemProject(selectedProject)) return false;
    
    return true;
    
  }.property('selection').cacheable(),
  
  contentStatusDidChange: function(status){
    // console.log('DEBUG: projectsController ' + status);
    if (status & SC.Record.READY){
      Tasks.projectsLoadSuccess();
    }
    else if (status & SC.Record.ERROR){
      Tasks.dataLoadFailure();
    }
  },

  editNewProject: function(project){
    var listView = Tasks.getPath('mainPage.mainPane.projectsList');
    var idx = listView.get('content').indexOf(project);
    var listItem = listView.itemViewForContentIndex(idx);
    if(listItem) listItem.beginEditing();
  }

});

// Tasks.projectsController.addProbe('sources');
