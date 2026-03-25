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


  // Lista de OSs para a tabela
  listaOrdensServico: any[] = [];

  // Controle de edição
  editandoOsId: number | null = null;

  // Controle dos modais de confirmação
  tituloConfirmacao = 'Confirmar Emissão';
  mensagemConfirmacao = 'Tem certeza que todos os dados da OS estão corretos? Esta ação registrará o serviço no sistema.';
  textoBotaoConfirmar = 'Sim, Emitir OS';
  textoBotaoCancelar = 'Revisar';
  acaoConfirmacao = () => this.inserirOrdemServico();

  novaOs: OrdemServico = this.criarNovaOs();

  criarNovaOs(): OrdemServico {
    return {
      cliente_id: null,
      tipo_servico_id: null,
      tecnico_id: null,
      status_servico: StatusOS.AguardandoTecnico,
      status_pagamento: StatusPagamento.Pendente,
      defeito_constatado: TipoDefeito.NaoIdentificado,
      equipamento: '', marca_modelo: '', numero_serie: '', acessorios_deixados: '',
      relato_cliente: '', data_previsao: '', atividade_realizada: '',
      pecas_trocadas: '', data_conclusao: '', valor_total: 0
    };
  }

  constructor(private supabaseService: SupabaseService) {}

  // O ngOnInit executa sozinho assim que a tela carrega

  ngOnInit() {
    this.carregarDadosEssenciais();
    this.buscarOrdensServico();
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
    // Define ação e textos do modal de acordo com edição ou criação
    if (this.editandoOsId) {
      this.tituloConfirmacao = 'Confirmar Alteração';
      this.mensagemConfirmacao = 'Deseja salvar as alterações desta Ordem de Serviço?';
      this.textoBotaoConfirmar = 'Salvar Alteração';
      this.textoBotaoCancelar = 'Cancelar';
      this.acaoConfirmacao = () => this.atualizarOrdemServico();
    } else {
      this.tituloConfirmacao = 'Confirmar Emissão';
      this.mensagemConfirmacao = 'Tem certeza que todos os dados da OS estão corretos? Esta ação registrará o serviço no sistema.';
      this.textoBotaoConfirmar = 'Sim, Emitir OS';
      this.textoBotaoCancelar = 'Revisar';
      this.acaoConfirmacao = () => this.inserirOrdemServico();
    }
    this.modalConfirmacao = true;
  }

  fecharModalSemSalvar() {
    this.modalConfirmacao = false;
  }

  fecharModalRetorno() {
    this.modalRetorno = false;
  }

  // --- OPERAÇÃO DE BANCO DE DADOS ---


  // CRUD principal
  async buscarOrdensServico() {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('ordens_servico')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      // Opcional: buscar nome do cliente para exibir na tabela
      this.listaOrdensServico = data || [];
    } catch (err) {
      this.tituloRetorno = 'Erro!';
      this.mensagemRetorno = 'Erro ao buscar ordens de serviço: ' + err.message;
      this.modalRetorno = true;
    }
  }

  async inserirOrdemServico() {
    this.modalConfirmacao = false;
    this.carregando = true;
    try {
      const { error } = await this.supabaseService.getClient()
        .from('ordens_servico')
        .insert([this.novaOs]);
      if (error) {
        this.tituloRetorno = 'Erro na Emissão';
        this.mensagemRetorno = 'Motivo: ' + error.message;
        this.modalRetorno = true;
      } else {
        this.tituloRetorno = 'Sucesso!';
        this.mensagemRetorno = 'Ordem de Serviço gerada e registrada no sistema.';
        this.modalRetorno = true;
        this.limparFormulario();
        this.buscarOrdensServico();
      }
    } catch (err) {
      this.tituloRetorno = 'Erro de Conexão';
      this.mensagemRetorno = 'Falha crítica ao tentar contatar o servidor.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  editarOrdemServico(os: any) {
    this.editandoOsId = os.id;
    this.novaOs = { ...os };
    // Ajusta selects se necessário (ex: enums)
  }

  async atualizarOrdemServico() {
    this.modalConfirmacao = false;
    this.carregando = true;
    try {
      const { error } = await this.supabaseService.getClient()
        .from('ordens_servico')
        .update(this.novaOs)
        .eq('id', this.editandoOsId);
      if (error) {
        this.tituloRetorno = 'Erro ao atualizar';
        this.mensagemRetorno = 'Motivo: ' + error.message;
        this.modalRetorno = true;
      } else {
        this.tituloRetorno = 'Alteração salva!';
        this.mensagemRetorno = 'Ordem de Serviço atualizada com sucesso.';
        this.modalRetorno = true;
        this.limparFormulario();
        this.buscarOrdensServico();
        this.editandoOsId = null;
      }
    } catch (err) {
      this.tituloRetorno = 'Erro de Conexão';
      this.mensagemRetorno = 'Falha crítica ao tentar contatar o servidor.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  confirmarExclusao(os: any) {
    this.tituloConfirmacao = 'Confirmar Exclusão';
    this.mensagemConfirmacao = `Deseja realmente excluir a OS #${os.id}? Esta ação não poderá ser desfeita.`;
    this.textoBotaoConfirmar = 'Excluir';
    this.textoBotaoCancelar = 'Cancelar';
    this.acaoConfirmacao = () => this.excluirOrdemServico(os.id);
    this.modalConfirmacao = true;
  }

  async excluirOrdemServico(id: number) {
    this.modalConfirmacao = false;
    this.carregando = true;
    try {
      const { error } = await this.supabaseService.getClient()
        .from('ordens_servico')
        .delete()
        .eq('id', id);
      if (error) {
        this.tituloRetorno = 'Erro ao excluir';
        this.mensagemRetorno = 'Motivo: ' + error.message;
        this.modalRetorno = true;
      } else {
        this.tituloRetorno = 'Excluído!';
        this.mensagemRetorno = 'Ordem de Serviço excluída com sucesso.';
        this.modalRetorno = true;
        this.buscarOrdensServico();
        if (this.editandoOsId === id) this.limparFormulario();
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
    this.novaOs = this.criarNovaOs();
    this.editandoOsId = null;
  }
}