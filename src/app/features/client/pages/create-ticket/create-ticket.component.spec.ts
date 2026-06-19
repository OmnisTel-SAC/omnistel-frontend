import { TestBed } from '@angular/core/testing';
import { CreateTicketComponent } from './create-ticket.component';
import { MessageService } from 'primeng/api';
import { ClientTicketService } from '../../../../core/services/client-ticket.service';
import { provideRouter } from '@angular/router';

describe('CreateTicketComponent', () => {
  let component: CreateTicketComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateTicketComponent],
      providers: [
        MessageService,
        provideRouter([]),
        { provide: ClientTicketService, useValue: { createTicket: () => {}, addAttachment: () => {} } },
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(CreateTicketComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have form invalid when empty', () => {
    const fixture = TestBed.createComponent(CreateTicketComponent);
    component = fixture.componentInstance;
    expect(component.form.invalid).toBe(true);
  });

  it('should have form valid with required fields', () => {
    const fixture = TestBed.createComponent(CreateTicketComponent);
    component = fixture.componentInstance;
    component.form.patchValue({ title: 'Test', category: 'SIN_CONEXION', priority: 'HIGH', description: 'Desc' });
    expect(component.form.valid).toBe(true);
  });

  it('should have 8 category options', () => {
    const fixture = TestBed.createComponent(CreateTicketComponent);
    component = fixture.componentInstance;
    expect(component.categories.length).toBe(8);
  });

  it('should have 4 priority options', () => {
    const fixture = TestBed.createComponent(CreateTicketComponent);
    component = fixture.componentInstance;
    expect(component.priorities.length).toBe(4);
  });
});
