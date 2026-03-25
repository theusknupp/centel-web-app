import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmissaoOs } from './emissao-os';

describe('EmissaoOs', () => {
  let component: EmissaoOs;
  let fixture: ComponentFixture<EmissaoOs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmissaoOs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmissaoOs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
