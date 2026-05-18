import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Bloco } from "@/lib/bloco-types";
import { BlocoCard } from "./BlocoCard";

interface Props {
  blocos: Bloco[];
  perfilId: number;
  editing: boolean;
  onDelete: (id: number) => void;
  onMove: (id: number, dir: -1 | 1) => void;
  onEdit: (bloco: Bloco) => void;
  onReorder: (ordenados: Bloco[]) => void;
  addSlot?: React.ReactNode;
}

function SortableBloco({
  bloco,
  perfilId,
  index,
  total,
  editing,
  onDelete,
  onMove,
  onEdit,
}: {
  bloco: Bloco;
  perfilId: number;
  index: number;
  total: number;
  editing: boolean;
  onDelete: (id: number) => void;
  onMove: (id: number, dir: -1 | 1) => void;
  onEdit: (bloco: Bloco) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bloco.id,
    disabled: !editing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <BlocoCard
        bloco={bloco}
        perfilId={perfilId}
        index={index}
        total={total}
        editing={editing}
        onDelete={onDelete}
        onMove={onMove}
        onEdit={onEdit}
        dragHandleProps={{ ...listeners }}
      />
    </div>
  );
}

export function BlocoGrid({
  blocos,
  perfilId,
  editing,
  onDelete,
  onMove,
  onEdit,
  onReorder,
  addSlot,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocos.findIndex((b) => b.id === active.id);
    const newIndex = blocos.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...blocos];
    const [removed] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, removed);
    onReorder(next);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocos.map((b) => b.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
          {blocos.map((b, i) => (
            <SortableBloco
              key={b.id}
              bloco={b}
              perfilId={perfilId}
              index={i}
              total={blocos.length}
              editing={editing}
              onDelete={onDelete}
              onMove={onMove}
              onEdit={onEdit}
            />
          ))}
          {addSlot}
        </div>
      </SortableContext>
    </DndContext>
  );
}

