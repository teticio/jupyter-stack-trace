import '../style/index.css';

import { CodeCell } from '@jupyterlab/cells';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IEditorTracker, FileEditor } from '@jupyterlab/fileeditor';
import { IOutput } from '@jupyterlab/nbformat';
import { NotebookActions } from '@jupyterlab/notebook';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the jupyter-stack-trace extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter-stack-trace:plugin',
  description: 'A JupyterLab extension to jump to the line in the file of the stack trace.',
  autoStart: true,
  requires: [IDocumentManager, IEditorTracker],
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    documentManager: IDocumentManager,
    editorTracker: IEditorTracker,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log('JupyterLab extension jupyter-stack-trace is activated!');

    let prefixes: string[] = [];
    let readOnly = true;

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('jupyter-stack-trace settings loaded:', settings.composite);
          prefixes = settings.get('prefixes').composite as string[];
          readOnly = settings.get('readOnly').composite as boolean;
        })
        .catch(reason => {
          console.error('Failed to load settings for jupyter-stack-trace.', reason);
        });
    }

    document.addEventListener('click', async (event: MouseEvent) => {
      const targetElement = event.target as HTMLElement;

      if (targetElement.classList.contains('ansi-green-fg')) {
        let [filename, line] = targetElement.textContent?.split(':') || [];

        for (let prefix of prefixes) {
          if (filename.startsWith(prefix)) {
            const path = filename.slice(prefix.length);
            const widget = documentManager.openOrReveal(path, 'default', undefined, { mode: 'split-bottom' });

            if (widget) {
              await widget.context.ready;

              if (editorTracker.currentWidget === widget && widget.content instanceof FileEditor) {
                const editor = (widget.content as FileEditor).editor;
                let line_number = Number(line) || 1;

                editor.setOption('readOnly', readOnly);
                editor.setCursorPosition({ line: line_number - 1, column: 0 });
                editor.setSelection({
                  start: { line: line_number - 1, column: 0 },
                  end: { line: line_number, column: 0 }
                });
              }
            }

            break;
          }
        }
      }
    });

    NotebookActions.executed.connect((_, args) => {
      const cell: CodeCell = args.cell as CodeCell;
      const outputs = cell.model.sharedModel.outputs;

      outputs.forEach((output: IOutput) => {
        if (output.output_type === 'error') {
          const stackTrace: string[] = output.traceback as string[] ?? [];
          const searchText = escape(stackTrace[stackTrace.length - 1].replace(/\x1b\[(.*?)([@-~])/g, ''));
          const url = 'https://google.com/search?q=' + searchText + '+site:stackoverflow.com';

          cell.model.outputs.add({
            output_type: 'display_data',
            data: {
              'text/html': '<br><button class="stack-trace-stack-overflow-btn" onclick="window.open(\'' + url + '\', \'_blank\');">Search Stack Overflow</button>'
            }
          });
        }
      });
    });

  }
}

export default plugin;
