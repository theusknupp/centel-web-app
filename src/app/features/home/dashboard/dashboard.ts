import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Navbar } from '../../../shared/components/navbar/navbar';
@Component({
  selector: 'app-dashboard', // Nome usado se fôssemos chamar essa tela dentro de outra
  standalone: true, 
  imports: [CommonModule, Navbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})


export class Dashboard implements OnInit {
  
  // Variável que guarda a data formatada para exibição no HTML
  dataAtual: string = '';

  //Metodo ao iniciar
  ngOnInit(): void {
    this.gerarDataFormatada();
  }

  // Método isolado focado apenas em capturar e formatar a data do sistema
  gerarDataFormatada(): void {
    // Instancia um objeto com a data de hoje
    const hoje = new Date();
    const opcoes: Intl.DateTimeFormatOptions = { 
      weekday: 'long',  // Nome completo do dia
      day: '2-digit',   // Formato 01, 02...
      month: 'long',    // Nome completo do mês para maior elegância
      year: 'numeric'   // Ano com quatro dígitos
    };

    // Converte a data usando a localização brasileira
    let dataCrua = hoje.toLocaleDateString('pt-BR', opcoes);
    
    // Capitaliza a primeira letra da string gerada para correção gramatical
    this.dataAtual = dataCrua.charAt(0).toUpperCase() + dataCrua.slice(1);
  }
}