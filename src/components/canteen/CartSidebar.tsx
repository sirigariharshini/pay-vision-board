import { ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartSidebarProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  isProcessing: boolean;
  onManualCheckout: () => void;
}

export default function CartSidebar({ 
  cart, 
  onUpdateQuantity, 
  onRemove, 
  isProcessing,
  onManualCheckout
}: CartSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="lg" className="fixed bottom-6 right-6 z-40 rounded-full shadow-2xl hover:shadow-primary/50 bg-gradient-to-r from-primary to-accent hover:scale-110 transition-all duration-300 animate-pulse hover:animate-none">
          <ShoppingCart className="w-5 h-5 mr-2" />
          Cart
          {totalItems > 0 && (
            <Badge variant="secondary" className="ml-2 bg-white/90 text-primary font-bold">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col z-50">
        <SheetHeader>
          <SheetTitle className="text-2xl">Your Cart</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 rounded-xl border-2 bg-gradient-to-r from-card to-card/50 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{item.name}</h4>
                  <p className="text-sm text-primary font-bold">
                    ${item.price.toFixed(2)} each
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  
                  <span className="w-8 text-center font-semibold">
                    {item.quantity}
                  </span>
                  
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(item.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-2xl text-primary">${totalPrice.toFixed(2)}</span>
            </div>

            <div className="space-y-4">
              <Button
                onClick={onManualCheckout}
                disabled={isProcessing}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  "Complete Payment"
                )}
              </Button>

              <div className="text-center p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30">
                <p className="text-sm text-muted-foreground">
                  {isProcessing 
                    ? "Verifying RFID scan..." 
                    : "Click to verify RFID scan and complete payment"}
                </p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
