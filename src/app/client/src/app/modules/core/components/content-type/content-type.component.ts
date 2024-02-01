import { Component, Input, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { FormService, UserService } from '@sunbird/core';
import * as _ from 'lodash-es';
import { LayoutService, ResourceService, UtilService, IUserData, NavigationHelperService} from '@sunbird/shared';
import { Router, ActivatedRoute } from '@angular/router';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TelemetryService } from '@sunbird/telemetry';
import { PermissionService } from '../../services';


@Component({
  selector: 'app-content-type',
  templateUrl: './content-type.component.html',
  styleUrls: ['./content-type.component.scss'],
})
export class ContentTypeComponent implements OnInit, OnDestroy {
  @Output() closeSideMenu = new EventEmitter<any>();
  @Input() layoutConfiguration;
  @Input() showBackButton = false;
  contentTypes;
  selectedContentType;
  isDesktopApp = false;
  public unsubscribe$ = new Subject<void>();
  subscription: any;
  userType: any;
  userRoles:any[] = [];
  returnTo: string;
  constructor(
    public formService: FormService,
    public resourceService: ResourceService,
    public router: Router,
    public userService: UserService,
    private telemetryService: TelemetryService,
    public activatedRoute: ActivatedRoute,
    public layoutService: LayoutService,
    private utilService: UtilService,
    public navigationhelperService: NavigationHelperService,
    public permissionService: PermissionService
  ) {}


  ngOnInit() {
    this.getContentTypes();
    this.isDesktopApp = this.utilService.isDesktopApp;
    this.layoutService.updateSelectedContentType
      .subscribe((data) => {
        this.updateSelectedContentType(data);
      });
  }


  setContentTypeOnUrlChange() {
    combineLatest(this.activatedRoute.queryParams, this.activatedRoute.params)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((result) => {
        this.setSelectedContentType(this.router.url, result[0], result[1]);
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  generateTelemetry(contentType) {
    const interactData = {
      context: {
        env: _.get(this.activatedRoute, 'snapshot.data.telemetry.env') || 'content-type',
        cdata: []
      },
      edata: {
        id: contentType,
        type: 'click',
        pageid: this.router.url || 'content-type'
      }
    };
    this.telemetryService.interact(interactData);
  }

  showContentType(data) {
    this.generateTelemetry(data.contentType);
    let userPreference;
    let params;
    try {
      if (this.userService.loggedIn) {
        userPreference = { framework: this.userService.defaultFrameworkFilters };
        params = _.cloneDeep(_.get(userPreference, 'framework'));
      } else {
        const guestUserDetails = localStorage.getItem('guestUserDetails');
        if (guestUserDetails) {
          userPreference = JSON.parse(guestUserDetails);
          params = _.cloneDeep(_.get(userPreference, 'framework'));
        }
      }
    } catch (error) {
      return null;
    }

    // All, myDownloads, workspace, resultEvaluation Tab should not carry any filters from other tabs / user can apply fresh filters
    if (data.contentType === 'mydownloads' || data.contentType === 'all' || data.contentType === 'workspace'  || data.contentType ===  'resultEvaluation') {
      params = _.omit(params, ['board', 'medium', 'gradeLevel', 'subject', 'se_boards', 'se_mediums', 'se_gradeLevels', 'se_subjects']);
    }
    if (this.userService.loggedIn) {
      this.router.navigate([data.loggedInUserRoute.route],
        { queryParams: { ...params, selectedTab: data.loggedInUserRoute.queryParam } });
    } else {
      !data.isLoginMandatory ?
        this.router.navigate([data.anonumousUserRoute.route],
          { queryParams: { ...params, selectedTab: data.anonumousUserRoute.queryParam } }) : window.location.href = data.loggedInUserRoute.route;
    }
  }

  setSelectedContentType(url, queryParams, pathParams) {
    if (url.indexOf('play') >= 0) {
      this.selectedContentType = queryParams.contentType ? queryParams.contentType.toLowerCase() : null;
    } else if (url.indexOf('explore-course') >= 0 || url.indexOf('learn') >= 0) {
      this.selectedContentType = queryParams.selectedTab ? queryParams.selectedTab : 'course';
    } else if (url.indexOf('explore-groups') >= 0) {
      this.selectedContentType = null;
    } else if (url.indexOf('resources') >= 0 || url.indexOf('explore') >= 0) {
      this.selectedContentType = queryParams.selectedTab ? queryParams.selectedTab : 'textbook';
    } else if (url.indexOf('mydownloads') >= 0) {
      this.selectedContentType = queryParams.selectedTab ? queryParams.selectedTab : 'mydownloads';
    } else if (url.indexOf('observation') >= 0) {
      this.selectedContentType = queryParams.selectedTab ? queryParams.selectedTab : 'observation';
    } else {
      this.selectedContentType = queryParams.selectedTab ? queryParams.selectedTab : null;
    }
  }
  updateSelectedContentType(contentType) {
    const ct = this.contentTypes.find((cty: any) => cty.contentType === contentType.toLowerCase());
    if (ct) {
      this.selectedContentType = ct.contentType;
    } else {
      this.selectedContentType = 'all';
    }
  }

  updateForm() {
    if (!this.userType) {
      if (this.userService.loggedIn) {
        this.userService.userData$.pipe(takeUntil(this.unsubscribe$)).subscribe((profileData: IUserData) => {
          if (_.get(profileData, 'userProfile.profileUserType.type')) {
            this.userType = profileData.userProfile['profileUserType']['type'];
          }

          this.userRoles = profileData.userProfile['roles'].length ? _.map(profileData.userProfile['roles'], 'role') : []; 
          this.makeFormChange();
        });
      } else {  
        const user = localStorage.getItem('userType');
        if (user) {
          this.userType = user;
          this.makeFormChange();
        }else{
          this.utilService.currentRole.pipe(takeUntil(this.unsubscribe$)).subscribe((res) => {
          this.userType = res;
          this.makeFormChange();
          });
        }
      }
    }
  }
  makeFormChange() {
    const index = this.contentTypes.findIndex(cty => cty.contentType === 'observation');
    const piaaIndex = this.contentTypes.findIndex(cty => cty.contentType === 'piaaAssessment');
    const workspaceIndex = this.contentTypes.findIndex(cty => cty.contentType === 'workspace');
    const resultEvaluationIndex = this.contentTypes.findIndex(cty => cty.contentType === 'resultEvaluation');
    const courseIndex = this.contentTypes.findIndex(cty => cty.contentType === 'course');
    const practiceQuestionSerIndex = this.contentTypes.findIndex(cty => cty.contentType === 'questionSets');

    if (this.userType != 'administrator' && index !== -1) {
      this.contentTypes[index].isEnabled = false;
    }
    else {
      if (this.contentTypes[index]) {
        this.contentTypes[index].isEnabled = true;
      }
    }
    // 'PIAA_SETTER','CONTENT_REVIEWER'
    if( (!_.isEmpty(this.userRoles) &&  !_.includes(this.userRoles, 'PUBLIC') &&  !_.includes(this.userRoles, 'CONTENT_CREATOR') && !_.includes(this.userRoles, 'CONTENT_REVIEWER') && !_.includes(this.userRoles, 'PIAA_SETTER') )  && piaaIndex !== -1){
      this.contentTypes[piaaIndex].isEnabled = false;
    }
    if( (!_.isEmpty(this.userRoles) && _.includes(this.userRoles, 'PIAA_SETTER') )  && piaaIndex !== -1){
      this.contentTypes[piaaIndex].isEnabled = true;
    }
    

    if( ((!_.isEmpty(this.userRoles) &&  (!_.includes(this.userRoles, 'NODAL_OFFICER') && !_.includes(this.userRoles, 'PIAA_SETTER')) ) || _.isEmpty(this.userRoles)) && workspaceIndex !== -1){
      this.contentTypes[workspaceIndex].isEnabled = false
    }

    if( ((!_.isEmpty(this.userRoles) &&  !_.includes(this.userRoles, 'ORG_ADMIN') ) || _.isEmpty(this.userRoles)) && resultEvaluationIndex !== -1){
      this.contentTypes[resultEvaluationIndex].isEnabled = false;
    } 

    if( (!_.isEmpty(this.userRoles) &&  _.includes(this.userRoles, 'ORG_ADMIN'))){
      if (courseIndex > -1 ) {
        this.contentTypes[courseIndex].isEnabled = false;
      }
      if (practiceQuestionSerIndex > -1 ) {
        this.contentTypes[practiceQuestionSerIndex].isEnabled = false;
      }
    } 

    if( (!_.isEmpty(this.userRoles) &&  _.includes(this.userRoles, 'PIAA_SETTER')  ) && workspaceIndex !== -1){
      this.contentTypes[workspaceIndex].loggedInUserRoute.route = 'workspace/content/create';
      this.contentTypes[workspaceIndex].loggedInUserRoute.queryParam = 'workspace/content/create';
    }


    if(!this.userService.loggedIn) {
      _.forEach(this.contentTypes, (contentType) => {
        if(contentType?.hideForGuestUser) {
          contentType.isEnabled = false;
        }
      });  
    }
    
  }

  processFormData(formData) {
    this.contentTypes = _.sortBy(formData, 'index');
    const defaultTab = _.find(this.contentTypes, ['default', true]);
    this.selectedContentType = this.activatedRoute.snapshot.queryParams.selectedTab || _.get(defaultTab, 'contentType') || 'textbook';
  }

  getTitle(contentType) {
    return _.get(this.resourceService, _.get(contentType, 'title'));
  }

  getIcon(contentType) {
    return _.get(contentType, 'theme.className');
  }

  getContentTypes() {
    const formServiceInputParams = {
      formType: 'contentcategory',
      formAction: 'menubar',
      contentType: 'global'
    };
    this.formService.getFormConfig(formServiceInputParams).subscribe((data: any) => {
      this.processFormData(data);
      this.updateForm();
      this.setContentTypeOnUrlChange();
    });
  }

  isLayoutAvailable() {
    return this.layoutService.isLayoutAvailable(this.layoutConfiguration);
  }
}
