import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-confirmacao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-confirmacao.html',
  styleUrl: './modal-confirmacao.scss'
})
export class ModalConfirmacao {
  
  // AS ENTRADAS (@Input)
  // O que a tela "Pai" vai enviar para escrever nesta Modal.
  // Textos Padrões
  @Input() titulo: string = 'Confirmação';
  @Input() mensagem: string = 'Deseja realmente realizar esta ação?';
  @Input() textoBotaoConfirmar: string = 'confirmar';
  @Input() textoBotaoCancelar: string = 'Cancelar';

  // AS SAÍDAS (@Output)
  // EventEmitters gritam para o sistema quando algo acontece.
  // O tipo <void> significa que o grito não carrega nenhum dado extra, é só o aviso.
  @Output() aoConfirmar = new EventEmitter<void>();
  @Output() aoCancelar = new EventEmitter<void>();

  // Funções chamadas pelos botões do HTML
  confirmar() {
    // A modal dispara (emitter) de confirmação para a tela Pai ouvir.
    this.aoConfirmar.emit();
  }

  cancelar() {
    // A modal dispara (emitter) de cancelamento.
    this.aoCancelar.emit();
  }
}