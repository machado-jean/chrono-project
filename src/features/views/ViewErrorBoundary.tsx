import { Component, type ErrorInfo, type ReactNode } from "react";

interface ViewErrorBoundaryProps {
  readonly children: ReactNode;
  readonly viewName: string;
  readonly language?: "pt-BR" | "en";
}

interface ViewErrorBoundaryState {
  readonly hasError: boolean;
}

export class ViewErrorBoundary extends Component<
  ViewErrorBoundaryProps,
  ViewErrorBoundaryState
> {
  public override state: ViewErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ViewErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`Falha ao renderizar ${this.props.viewName}.`, error, info);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="view-error" role="alert">
          <strong>{this.props.language === "en" ? `Unable to show ${this.props.viewName}.` : `Não foi possível exibir ${this.props.viewName}.`}</strong>
          <span>{this.props.language === "en" ? "Tasks are still preserved. Try loading the view again." : "As tarefas continuam preservadas. Tente carregar a visualização novamente."}</span>
          <button type="button" onClick={() => { this.setState({ hasError: false }); }}>
            {this.props.language === "en" ? "Try again" : "Tentar novamente"}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
