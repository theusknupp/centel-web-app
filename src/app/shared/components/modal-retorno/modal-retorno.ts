import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal-retorno',
  imports: [],
  templateUrl: './modal-retorno.html',
  styleUrl: './modal-retorno.scss',
})
export class ModalRetorno {

  
  // AS ENTRADAS (@Input)
  // Textos Padrões
  @Input() titulo: string = 'Aviso';
  @Input() mensagem: string = 'Ação realizada com sucesso.';
  @Input() textoBotaoConfirmar: string = 'Ok';

  @Output() aoConfirmar = new EventEmitter<void>();

  // Funções chamadas pelos botões do HTML
  confirmar() {
    this.aoConfirmar.emit();
  }


}
