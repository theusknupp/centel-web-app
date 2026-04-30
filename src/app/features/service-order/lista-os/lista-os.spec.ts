import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaOs } from './lista-os';

describe('ListaOs', () => {
  let component: ListaOs;
  let fixture: ComponentFixture<ListaOs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaOs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaOs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
