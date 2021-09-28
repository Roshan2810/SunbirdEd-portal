import { FormsModule } from '@angular/forms';
import { fakeActivatedRoute, groupData } from './../../services/groups/groups.service.spec.data';
import { Router, ActivatedRoute } from '@angular/router';
import { TelemetryService } from '@sunbird/telemetry';
import { configureTestSuite } from '@sunbird/test-util';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SharedModule } from '@sunbird/shared';
import { SuiModule } from 'ng2-semantic-ui-v9';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';

import { PopupComponent } from './popup.component';
import { acceptTnc } from '../../interfaces';

describe('PopupComponent', () => {
  let component: PopupComponent;
  let fixture: ComponentFixture<PopupComponent>;
  configureTestSuite();

  class RouterStub {
    navigate = jasmine.createSpy('navigate');
    url: '/';
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupComponent ],
      imports: [ SuiModule, SharedModule.forRoot(), HttpClientTestingModule, FormsModule ],
      providers: [
        TelemetryService,
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: Router, useClass: RouterStub},
        { provide: ActivatedRoute, useValue: fakeActivatedRoute }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it ('should "emit event with name: delete " when param is delete', () => {
    component.name = 'delete';
    component.modal = {
      deny: jasmine.createSpy('deny')
    };
    spyOn(component.handleEvent, 'emit');
    component.emitEvent(true);
    expect(component.handleEvent.emit).toHaveBeenCalledWith({name: 'delete', action: true});
    expect(component.modal.deny).toHaveBeenCalled();
  });

  it ('should "emit event with name: deActivate " when param is delete', () => {
    component.name = 'deActivate';
    component.modal = {
      deny: jasmine.createSpy('deny')
    };
    spyOn(component.handleEvent, 'emit');
    component.emitEvent(true);
    expect(component.handleEvent.emit).toHaveBeenCalledWith({name: 'deActivate', action: true});
    expect(component.modal.deny).toHaveBeenCalled();
  });

  it ('should "emit event with name: activate " when param is delete', () => {
    component.name = 'activate';
    component.modal = {
      deny: jasmine.createSpy('deny')
    };
    spyOn(component.handleEvent, 'emit');
    component.emitEvent(true);
    expect(component.handleEvent.emit).toHaveBeenCalledWith({name: 'activate', action: true});
    expect(component.modal.deny).toHaveBeenCalled();
  });

  it ('should "emit empty event "', () => {
    component.name = 'delete';
    component.modal = {
      deny: jasmine.createSpy('deny')
    };
    spyOn(component.handleEvent, 'emit');
    component.emitEvent(false);
    expect(component.handleEvent.emit).toHaveBeenCalledWith({name: 'delete', action: false});
    expect(component.modal.deny).toHaveBeenCalled();
  });

  it ('should "emit handleGroupTnc event "', () => {
    component.tncModal = {
      deny: jasmine.createSpy('deny')
    };
    component.type = acceptTnc.GROUP;
    spyOn(component.handleGroupTnc, 'emit');
    component.acceptGroupTnc();
    expect(component.handleGroupTnc.emit).toHaveBeenCalledWith({type: acceptTnc.GROUP});
    expect(component.tncModal.deny).toHaveBeenCalled();
  });

  it ('should "emit handleGroupTnc event  and close Modal"', () => {
    component.tncModal = {
      deny: jasmine.createSpy('deny')
    };
    spyOn(component.handleGroupTnc, 'emit');
    component.closeModal();
    expect(component.handleGroupTnc.emit).toHaveBeenCalledWith();
    expect(component.tncModal.deny).toHaveBeenCalled();
  });

});
