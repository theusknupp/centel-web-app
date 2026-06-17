import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Navbar } from '../../../shared/components/navbar/navbar';
import { SupabaseService } from '../../../core/services/supabase.service';
import { StatusOS } from '../../../enums/StatusOS-enum';

@Component({
  selector: 'app-dashboard', 
  standalone: true, 
  imports: [CommonModule, Navbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  
  // Variável que guarda a data formatada para exibição no HTML
  dataAtual: string = '';

  // Variáveis das métricas
  osCadastradasMes = 0;
  osConcluidasMes = 0;
  osEmAndamento = 0;
  carregando = true;

  // Injetando o Supabase para buscar os dados
  constructor(private supabase: SupabaseService) {}

  // Metodo ao iniciar
  ngOnInit(): void {
    this.gerarDataFormatada();
    this.carregarMetricas(); // Chama a busca no banco ao carregar a tela
  }

  // Método isolado focado apenas em capturar e formatar a data do sistema
  gerarDataFormatada(): void {
    const hoje = new Date();
    const opcoes: Intl.DateTimeFormatOptions = { 
      weekday: 'long',  
      day: '2-digit',   
      month: 'long',    
      year: 'numeric'   
    };

    let dataCrua = hoje.toLocaleDateString('pt-BR', opcoes);
    this.dataAtual = dataCrua.charAt(0).toUpperCase() + dataCrua.slice(1);
  }

  // Método para buscar e calcular as OS
  async carregarMetricas() {
    this.carregando = true;
    try {
      // Pega o primeiro dia do mês atual para filtrar
      const dataHoje = new Date();
      const primeiroDiaMes = new Date(dataHoje.getFullYear(), dataHoje.getMonth(), 1).toISOString();

      // Busca apenas o status e a data de criação (para ficar super rápido)
      const { data, error } = await this.supabase.getClient()
        .from('ordens_servico')
        .select('status_servico, created_at');

      if (error) throw error;

      if (data) {
        // 1. Cadastradas no mês
        this.osCadastradasMes = data.filter(os => os.created_at >= primeiroDiaMes).length;

        // 2. Concluídas no mês
        this.osConcluidasMes = data.filter(os => 
          os.status_servico === StatusOS.Concluido && os.created_at >= primeiroDiaMes
        ).length;

        // 3. Em Andamento (Tudo que não for Concluído nem Entregue)
        this.osEmAndamento = data.filter(os => 
          os.status_servico !== StatusOS.Concluido && os.status_servico !== StatusOS.AguardandoPeca && os.status_servico !== StatusOS.AguardandoTecnico
        ).length;
      }
    } catch (error) {
      console.error("Erro ao buscar métricas do Dashboard", error);
    } finally {
      this.carregando = false;
    }
  }
}