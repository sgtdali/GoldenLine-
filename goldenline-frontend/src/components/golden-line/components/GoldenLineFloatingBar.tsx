import React from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Package } from 'lucide-react';

interface GoldenLineFloatingBarProps {
    onDragStart: (event: React.DragEvent, nodeType: string, label: string) => void;
    showCatalog: boolean;
    onToggleCatalog: () => void;
}

export const GoldenLineFloatingBar: React.FC<GoldenLineFloatingBarProps> = ({ onDragStart, showCatalog, onToggleCatalog }) => {
    return (
        <div className="node-floating-bar">
            <Card className="node-floating-card">
                <div className="floating-actions">
                    <Button
                        variant={showCatalog ? "default" : "outline"}
                        size="sm"
                        onClick={onToggleCatalog}
                        className="gap-2"
                    >
                        <Package className="w-4 h-4" />
                        {showCatalog ? 'Kataloğu Kapat' : 'Katalogdan Ekle'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        draggable
                        onDragStart={(event) => onDragStart(event, "default", "Makine")}
                    >
                        Boş Makine
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        draggable
                        onDragStart={(event) => onDragStart(event, "grup", "Hücre")}
                    >
                        Hücre Ekle
                    </Button>
                </div>
            </Card>
        </div>
    );
};
