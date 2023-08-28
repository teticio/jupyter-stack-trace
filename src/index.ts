import '../style/index.css';

import { IDocumentManager } from '@jupyterlab/docmanager';
import { IEditorTracker, FileEditor } from '@jupyterlab/fileeditor';

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
    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('jupyter-stack-trace settings loaded:', settings.composite);
          prefixes = settings.get('prefixes').composite as string[];
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

                editor.setOption('readOnly', true);
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
  }
}

export default plugin;
