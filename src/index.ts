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
  description:
    'A JupyterLab extension to jump to the line in the file of the stack trace.',
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
          console.log(
            'jupyter-stack-trace settings loaded:',
            settings.composite
          );
          prefixes = settings.get('prefixes').composite as string[];
          readOnly = settings.get('readOnly').composite as boolean;
        })
        .catch(reason => {
          console.error(
            'Failed to load settings for jupyter-stack-trace.',
            reason
          );
        });
    }

    document.addEventListener('click', async (event: MouseEvent) => {
      const targetElement = event.target as HTMLElement;

      if (targetElement.classList.contains('ansi-green-fg')) {
        const [filename, line] = targetElement.textContent?.split(':') || [];

        for (const prefix of prefixes) {
          if (filename.startsWith(prefix)) {
            const path = filename.slice(prefix.length);
            const widget = documentManager.openOrReveal(
              path,
              'default',
              undefined,
              { mode: 'split-bottom' }
            );

            if (widget) {
              await widget.context.ready;

              if (
                editorTracker.currentWidget === widget &&
                widget.content instanceof FileEditor
              ) {
                const editor = (widget.content as FileEditor).editor;
                const line_number = Number(line) || 1;

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
          const stackTrace: string[] = (output.traceback as string[]) ?? [];
          const escapedStackTraces = stackTrace.map(item =>
            escape(
              // eslint-disable-next-line no-control-regex
              item.replace(/\x1b\[(.*?)([@-~])/g, '')
            )
          );

          const stackOverflowUrl =
            'https://google.com/search?q=' +
            escapedStackTraces[escapedStackTraces.length - 1] +
            '+site:stackoverflow.com';
          const stackOverflowButton =
            '<button class="stack-trace-btn" onclick="window.open(\'' +
            stackOverflowUrl +
            "', '_blank');\">Search Stack Overflow</button>";
          const bingChatUrl =
            'https://www.bing.com/chat?iscopilotedu=1&sendquery=1&q=' +
            escape('Please help me with the following error:\n') +
            escapedStackTraces.join('%0A');
          const bingButton =
            '<button class="stack-trace-btn" onclick="window.open(\'' +
            bingChatUrl +
            "', '_blank');\">Ask Bing Chat</button>";
          const html =
            '<table width="100%"><tr><td style="text-align:left;">' +
            stackOverflowButton +
            '</td><td style="text-align:right;">' +
            bingButton +
            '</td></tr></table>';

          cell.model.outputs.add({
            output_type: 'display_data',
            data: {
              'text/html': html
            }
          });
        }
      });
    });
  }
};

export default plugin;
