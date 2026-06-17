import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ModalConfirmacao } from '../../../shared/components/modal-confirmacao/modal-confirmacao';
import { ModalRetorno } from '../../../shared/components/modal-retorno/modal-retorno';
import { TemPermissaoDirective } from '../../../shared/components/permissoes/tem-permissao.directive';
import { Permissoes } from '../../../core/constants/permissions';
import { StatusOS } from '../../../enums/StatusOS-enum';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-os',
  standalone: true,
  imports: [Navbar, CommonModule, ModalConfirmacao, ModalRetorno, TemPermissaoDirective, FormsModule],
  templateUrl: './lista-os.html',
  styleUrl: './lista-os.scss'
})
export class ListaOsComponent implements OnInit {
  protected readonly Permissoes = Permissoes;

  carregando = true;
  listaOrdensServico: any[] = [];
  listaClientes: any[] = [];

  // Controle de Modais
  modalConfirmacao = false;
  modalRetorno = false;
  tituloConfirmacao = '';
  mensagemConfirmacao = '';
  textoBotaoConfirmar = 'Confirmar';
  textoBotaoCancelar = 'Cancelar';
  acaoConfirmacao: () => void = () => {};
  tituloRetorno = '';
  mensagemRetorno = '';

  // --- VARIÁVEIS DE FILTRO ---
  filtroId: string = '';
  filtroCliente: string = '';
  filtroStatus: string = '';
  opcoesStatusOS = Object.values(StatusOS); // Para popular o <select>

  constructor(private supabaseService: SupabaseService, private router: Router) {}

  ngOnInit() {
    this.carregarDados();
  }

  async carregarDados() {
    this.carregando = true;
    try {
      // Traz apenas o nome e ID dos clientes para cruzar na tabela
      const clienteReq = await this.supabaseService.getClient().from('clientes').select('id,nome');
      if (clienteReq.data) this.listaClientes = clienteReq.data;
      
      await this.buscarOrdensServico();
    } catch (err) {
      this.tituloRetorno = 'Erro de Sistema';
      this.mensagemRetorno = 'Falha ao conectar com o banco de dados.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  // --- LÓGICA DE FILTRAGEM TRIPLA ---
  get listaOsFiltrada() {
    return this.listaOrdensServico.filter(os => {
      // 1. Filtro de ID
      const matchId = this.filtroId ? os.id.toString().includes(this.filtroId.trim()) : true;
      
      // 2. Filtro de Cliente (Ajuste 'os.clientes.nome' conforme o retorno do seu banco)
      const nomeCliente = os.clientes?.nome || os.nome_cliente || '';
      const matchCliente = this.filtroCliente 
        ? nomeCliente.toLowerCase().includes(this.filtroCliente.toLowerCase().trim()) 
        : true;
      
      // 3. Filtro de Status
      const matchStatus = this.filtroStatus ? os.status_servico === this.filtroStatus : true;

      // Só exibe a OS se ela passar nos três testes ao mesmo tempo
      return matchId && matchCliente && matchStatus;
    });
  }

  async buscarOrdensServico() {
    const { data, error } = await this.supabaseService.getClient()
      .from('ordens_servico')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    this.listaOrdensServico = (data || []).map((os: any) => {
      // Relaciona o ID com o Nome do Cliente
      const cliente = this.listaClientes.find(c => c.id === os.cliente_id);
      os.cliente_nome = cliente ? cliente.nome : os.cliente_id;
      return os;
    });
  }

  editarOrdemServico(os: any) {
    // Viaja para a rota de emissão levando os dados da OS na bagagem (state)
    this.router.navigate(['/emissao-os'], { state: { osSelecionada: os } });
  }

  confirmarExclusao(os: any) {
    this.tituloConfirmacao = 'Confirmar Exclusão';
    this.mensagemConfirmacao = `Deseja realmente excluir a OS #${os.id}?`;
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
        .from('ordens_servico').delete().eq('id', id);

      if (error) {
        this.tituloRetorno = 'Erro ao excluir';
        this.mensagemRetorno = error.message;
      } else {
        this.tituloRetorno = 'Excluído!';
        this.mensagemRetorno = 'Ordem de Serviço removida com sucesso.';
        this.buscarOrdensServico(); // Atualiza a tabela
      }
      this.modalRetorno = true;
    } catch (err) {
      this.tituloRetorno = 'Erro de Conexão';
      this.mensagemRetorno = 'Falha ao tentar excluir.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  fecharModalSemSalvar() { this.modalConfirmacao = false; }
  fecharModalRetorno() { this.modalRetorno = false; }
}