<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'product';

    protected $fillable = [
        'seller_id',
        'name',
        'slug',
        'description',
        'category',
        'sku',
        'price',
        'stock',
        'sold_count',
        'main_image_url',
        'images',
        'weight',
        'options',
        'is_active',
    ];

    protected $casts = [
        'images' => 'array',
        'options' => 'array',
    ];

    public function seller()
    {
        return $this->belongsTo(Seller::class);
    }
}


