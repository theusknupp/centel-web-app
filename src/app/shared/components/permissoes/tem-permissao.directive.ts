import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from "@angular/core";
import { Subscription } from "rxjs";
import { PermissaoService } from "../../../core/services/permissao/permissao.service";

@Directive({selector: '[temPermissao]', standalone: true})
export class TemPermissaoDirective implements OnInit, OnDestroy {
    @Input() temPermissao!: string | string[];
    @Input() temPermissaoModo: 'todos' | 'algum' = 'todos';
    @Input() temPermissaoElse?: TemplateRef<any>;

    private sub?: Subscription;
    private mostrou = false;
    
    constructor(
        private tpl: TemplateRef<any>,
        private vcr: ViewContainerRef,
        private permissaoService: PermissaoService
    ) {}
 
    ngOnInit() {
        const perms = Array.isArray(this.temPermissao) ? this.temPermissao : [this.temPermissao];

        const check$ = this.temPermissaoModo === 'todos'
            ? this.permissaoService.temTodas$(perms)
            : this.permissaoService.temAlguma$(perms);

        this.sub = check$.subscribe(temPermissao => {
            this.vcr.clear();
            this.mostrou = false;

            if (temPermissao) {
                this.vcr.createEmbeddedView(this.tpl);
                this.mostrou = true;
            } else if (this.temPermissaoElse) {
                this.vcr.createEmbeddedView(this.temPermissaoElse);
            }
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }
}

