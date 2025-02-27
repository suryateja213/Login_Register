import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service'; // Use AuthService for product API
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})

export class DashboardComponent implements OnInit {
  user: any = {}; // Stores the user data
  profileImageUrl: string = ''; // Stores the URL of the user's profile image
  loading: boolean = true; // To display loading state while fetching data
  error: string = ''; // To handle any error that occurs during data fetch
  dropdownVisible: boolean = false; // Controls dropdown visibility
  products: any[] = []; // Array to store the product data
  productError: string = ''; // Error handling for product data
  groupedProducts: any[] = []; // Array to store grouped product data
  vendorsLimit: number = 3; // Limit the number of vendors to display before showing the "More" option
  
  
  // Pagination variables
  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 15;

   // For editing product
   productToEdit: any = null; 
   updatedProductForm!: FormGroup;

  constructor(
    private authService: AuthService, // Inject AuthService
    private router: Router,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.loadProducts(); // Load the first page of products
    this.authService.getUserData().subscribe({
      next: (userData) => {
        this.user = userData;
        this.profileImageUrl = this.user.profile_pic || '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching user data', err);
        this.error = 'Failed to load user data.';
        this.loading = false;
      },
    });

    // Initialize the form with empty values
    this.updatedProductForm = this.fb.group({
      product_name: ['', Validators.required],
      quantity_in_stock: ['', [Validators.required, Validators.min(0)]],
      unit_price: ['', [Validators.required, Validators.min(0)]],
      vendors: [[]], // Default as an empty array
    });
  }

  // Load products with pagination
  loadProducts(page: number = this.currentPage, size: number = this.pageSize): void {
    this.loading = true; // Start loading before fetching products
    this.authService.getProductDetails(page, size).subscribe({
      next: (data) => {
        this.products = data.products; // Store fetched product data
        this.groupProductsByName(); // Group the products by name
        this.totalPages = data.totalPages; // Total pages returned by the backend
        this.currentPage = data.currentPage; // Set the current page from the backend
        this.loading = false; // End loading after data is fetched
        console.log("Fetched products", this.products);
      },
      error: (err) => {
        console.error('Error fetching product details', err);
        this.productError = 'Failed to load product data.';
        this.loading = false; // End loading on error
      },
    });
  }

  // Handle Edit button click to open product editing modal
  onEditProduct(product: any): void {
    this.productToEdit = product;
    console.log('Product being edited:', product);
     // Set the product to be edited
    this.productToEdit = product;
    // Initialize the form with the product data
    this.updatedProductForm.setValue({
      product_name: product.product_name_and_image?.name,
      quantity_in_stock: product.quantity,
      unit_price: product.unit,
      vendors: product.vendors.map((vendor: any) => vendor.vendor_id),
    });
  }

  onCancelEdit(): void {
    this.productToEdit = null; // Hide the form
  }

   // Submit the edited product data
   onUpdateProduct(): void {
    if (this.updatedProductForm.invalid) {
      return; // Don't proceed if the form is invalid
    }

    if (!this.productToEdit) {
      return;
    }

    const updatedData = this.updatedProductForm.value;

    this.authService.updateProductDetails(this.productToEdit.product_id, updatedData).subscribe({
      next: () => {
        alert('Product updated successfully!');
        // Find and update the product in the local products array
        const updatedProductIndex = this.products.findIndex(product => product.product_id === this.productToEdit.product_id);
        if (updatedProductIndex !== -1) {
          this.products[updatedProductIndex] = {
            ...this.products[updatedProductIndex],
            ...updatedData,
            product_name_and_image: {
              ...this.products[updatedProductIndex].product_name_and_image,
              name: updatedData.product_name,
            },
            vendors: updatedData.vendors || this.products[updatedProductIndex].vendors, // Update vendors if needed
            unit: updatedData.unit_price, // Assuming unit price is the same as the unit
            quantity: updatedData.quantity_in_stock, // Update quantity
          };
        }

        // Re-group the products after the update
        this.groupProductsByName();

        this.productToEdit = null; // Reset the product being edited
        this.updatedProductForm.reset();
      },
      error: (err) => {
        console.error('Error updating product', err);
        alert('Failed to update product.');
      },
    });
  }

  groupProductsByName() {
    // Filter out products that are deleted (status === 99)
    const filteredProducts = this.products.filter((product) => product.status !== 99);
    
    // console.log('Filtered Products:', filteredProducts);  // Debugging: Log filtered products
  
    // Group products by their name and image
    const grouped = filteredProducts.reduce((acc, product) => {
      const productNameWithImage = product.product_name_and_image?.name || 'Unnamed Product';
      const productImageUrl = product.product_name_and_image?.image || 'assets/default-product-image.jpg';
  
      // Ensure product has valid category array
      const categories = product.category ? [product.category] : [];  // Fallback if no category exists
  
      categories.forEach((category: string) => {
        if (!acc[productNameWithImage]) {
          acc[productNameWithImage] = [];
        }
  
        // Add product with its category to the accumulator
        acc[productNameWithImage].push({
          ...product,         // Copy all product properties
          category,           // Add the current category to the product
          product_name_and_image_combined: {
            name: productNameWithImage,
            image: productImageUrl
          },
          vendors: product.vendors || []  // Ensure vendors is always an array
        });
      });
  
      return acc;
    }, {});
  
    // console.log('Grouped Data:', grouped);  // Debugging: Log the grouped products
  
    // Convert the grouped object to an array format for display in the template
    this.groupedProducts = Object.keys(grouped).map((productName) => ({
      productName,
      products: grouped[productName],
    }));
  
    //console.log('Final Grouped Products:', this.groupedProducts);  // Final check of groupedProducts
  }
  

  // Change page handler
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadProducts(page); // Load products for the selected page
    }
  }

  // Toggle dropdown visibility
  toggleDropdown(): void {
    this.dropdownVisible = !this.dropdownVisible;
  }

  @HostListener('document:click', ['$event.target'])
  onOutsideClick(target: HTMLElement) {
    if (!target.closest('.dropdown-menu') && !target.closest('.user-info')) {
      this.dropdownVisible = false;
    }
  }

  onUpdateProfilePicture(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('profilePicture', file);

        this.authService.uploadProfilePicture(formData).subscribe({
          next: (response: any) => {
            this.profileImageUrl = response.profilePicUrl;
            this.user.profile_pic = response.profilePicUrl;
            alert('Profile picture updated successfully!');
          },
          error: (err) => {
            console.error('Error uploading profile picture', err);
            alert('Failed to update profile picture.');
          },
        });
      }
    };
    fileInput.click();
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Method to show more vendors
  showMoreVendors(product: any): void {
    alert(`Showing all vendors for: ${product.product_name}`);
  }

// Download product as PDF
onDownloadProduct(product: any): void {
  this.authService.downloadProductAsPdf(product); // Call the service to generate PDF
}

onDeleteProduct(product: any): void {
  console.log('Deleting product with ID:', product.id);
  const confirmation = confirm('Are you sure you want to delete this product?');
  if (confirmation) {
    this.authService.deleteProduct(product.product_id).subscribe({
      next: () => {
        alert('Product deleted successfully!');
        this.loadProducts(); // Reload the product list after deletion
      },
      error: (err) => {
        console.error('Error deleting product', err);
        alert('Failed to delete product.');
      },
    });
  }
}

}