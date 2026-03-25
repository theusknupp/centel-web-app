import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ModalConfirmacao } from '../../../shared/components/modal-confirmacao/modal-confirmacao';
import { ModalRetorno } from '../../../shared/components/modal-retorno/modal-retorno';
// Importação dos modelos e enums
import { OrdemServico } from '../../../models/ordem-servico';

//Enums
import { StatusOS } from '../../../enums/StatusOS-enum'; 
import { StatusPagamento } from '../../../enums/StatusPagamento-enum';
import { TipoDefeito } from '../../../enums/TipoDefeito-enum';

@Component({
  selector: 'app-emissao-os',
  standalone: true,
  imports: [Navbar, FormsModule, CommonModule, ModalConfirmacao, ModalRetorno],
  templateUrl: './emissao-os.html',
  styleUrl: './emissao-os.scss',
})
export class EmissaoOs implements OnInit {

  // Controle de interface
  carregando = false;
  carregandoDadosIniciais = true; // Para mostrar uma mensagem enquanto o banco responde
  modalConfirmacao = false;
  modalRetorno = false;
  tituloRetorno = '';
  mensagemRetorno = '';

  // Arrays que vão armazenar os dados vindos do banco para popular os <select>
  listaClientes: any[] = [];
  listaTiposServico: any[] = [];
  listaTecnicos: any[] = [];

  // Object.values converte o Enum em um Array comum para o HTML (ngFor) poder ler
  opcoesStatusOS = Object.values(StatusOS);
  opcoesStatusPagamento = Object.values(StatusPagamento);
  opcoesTipoDefeito = Object.values(TipoDefeito);

  // Inicialização do objeto seguindo as regras da Interface e dos Enums
  novaOs: OrdemServico = {
    cliente_id: null,
    tipo_servico_id: null,
    tecnico_id: null,
    
    // Status padrões ao abrir uma nova Ordem de Serviço
    status_servico: StatusOS.AguardandoTecnico,
    status_pagamento: StatusPagamento.Pendente,
    defeito_constatado: TipoDefeito.NaoIdentificado,
    
    equipamento: '', marca_modelo: '', numero_serie: '', acessorios_deixados: '',
    relato_cliente: '', data_previsao: '', atividade_realizada: '',
    pecas_trocadas: '', data_conclusao: '', valor_total: 0
  };

  constructor(private supabaseService: SupabaseService) {}

  // O ngOnInit executa sozinho assim que a tela carrega
  ngOnInit() {
    this.carregarDadosEssenciais();
  }

  // Busca os clientes, serviços e técnicos cadastrados no banco para o usuário poder selecionar
  async carregarDadosEssenciais() {
    try {
      //Dados pra preencher as listas
      const clienteReq = await this.supabaseService.getClient().from('clientes').select('nome');
      const servicoReq = await this.supabaseService.getClient().from('tipos_servicos').select('id, descricao');
      const tecnicoReq = await this.supabaseService.getClient().from('tecnicos').select('id, nome');

      if (clienteReq.data) this.listaClientes = clienteReq.data;
      if (servicoReq.data) this.listaTiposServico = servicoReq.data;
      if (tecnicoReq.data) this.listaTecnicos = tecnicoReq.data;
    } catch (err) {
      this.tituloRetorno = 'Erro!'
      this.mensagemRetorno = 'Erro ao buscar dados do banco' +err;
      this.modalRetorno = true;
    } finally {
      this.carregandoDadosIniciais = false;
    }
  }

  // --- CONTROLE DAS MODAIS ---

  salvarOs() {
    // Apenas exibe a pergunta de confirmação
    this.modalConfirmacao = true;
  }

  fecharModalSemSalvar() {
    this.modalConfirmacao = false;
  }

  fecharModalRetorno() {
    this.modalRetorno = false;
  }

  // --- OPERAÇÃO DE BANCO DE DADOS ---

  async inserirOrdemServico() {
    this.modalConfirmacao = false; // Fecha a pergunta
    this.carregando = true; // Ativa visual de processamento no botão

    try {

      // Executa o Insert
      const { error } = await this.supabaseService.getClient()
        .from('ordens_servico')
        .insert([this.novaOs]);

      if (error) {
        // Alimenta a modal de retorno com a mensagem de erro
        this.tituloRetorno = 'Erro na Emissão';
        this.mensagemRetorno = 'Motivo: ' + error.message;
        this.modalRetorno = true;
        
      } else {
        // Alimenta a modal de retorno com o sucesso
        this.tituloRetorno = 'Sucesso!';
        this.mensagemRetorno = 'Ordem de Serviço gerada e registrada no sistema.';
        this.modalRetorno = true;
        this.limparFormulario(); // Limpa apenas em caso de sucesso absoluto
      }

    } catch (err) {
      this.tituloRetorno = 'Erro de Conexão';
      this.mensagemRetorno = 'Falha crítica ao tentar contatar o servidor.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  // Reseta os campos mantendo os Enums padrão
  limparFormulario() {
    this.novaOs = {
      cliente_id: null, tipo_servico_id: null, tecnico_id: null,
      status_servico: StatusOS.AguardandoTecnico,
      status_pagamento: StatusPagamento.Pendente,
      defeito_constatado: TipoDefeito.NaoIdentificado,
      equipamento: '', marca_modelo: '', numero_serie: '', acessorios_deixados: '',
      relato_cliente: '', data_previsao: '', atividade_realizada: '',
      pecas_trocadas: '', data_conclusao: '', valor_total: 0
    };
  }
}