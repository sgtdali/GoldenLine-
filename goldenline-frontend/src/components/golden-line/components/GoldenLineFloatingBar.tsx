import React from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface GoldenLineFloatingBarProps {
    onDragStart: (event: React.DragEvent, nodeType: string, label: string) => void;
}

export const GoldenLineFloatingBar: React.FC<GoldenLineFloatingBarProps> = ({ onDragStart }) => {
    return (
        <div className="node-floating-bar">
            <Card className="node-floating-card">
                <div className="floating-actions">
                    <Button
                        variant="outline"
                        size="sm"
                        draggable
                        onDragStart={(event) =>
                            onDragStart(event, "default", "Makine")
                        }
                    >
                        Makine Ekle
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
