import { Icon } from '../../ui/Icon';
import { Pressable } from '../../ui/Pressable';

export interface Action {
  id: string;
  label: string;
  icon: string;
  run: () => void;
}

/** Round buttons under the pocket, scrollable sideways like the bank app. */
export function ActionRow({ actions }: { actions: Action[] }) {
  return (
    <div className="actions" role="toolbar" aria-label="Действия">
      {actions.map((a) => (
        <Pressable key={a.id} className="action" onPress={a.run} scale={0.9}>
          <span className="action-circle surface">
            <Icon name={a.icon} size={26} />
          </span>
          <span className="action-label">{a.label}</span>
        </Pressable>
      ))}
    </div>
  );
}
