import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRetorno } from './modal-retorno';

describe('ModalRetorno', () => {
  let component: ModalRetorno;
  let fixture: ComponentFixture<ModalRetorno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalRetorno]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalRetorno);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
