import { useState, useEffect, useCallback } from "react";
import {
    Page,
    Layout,
    Card,
    IndexTable,
    useIndexResourceState,
    Text,
    Thumbnail,
    Pagination,
    Icon,
    LegacyCard,
    Grid,
    Select,
    Filters,
    Badge,
    Modal,
    Button,
    ButtonGroup,
    TextField,
    Checkbox,
} from "@shopify/polaris";
import { PinIcon, CheckCircleIcon, StarFilledIcon } from "@shopify/polaris-icons";
import apiClient from "../services/api";

interface ReviewMedia {
    id: number;
    mediaUrl: string;
    mediaType: string;
}

interface Review {
    id: number;
    shop: string;
    productId: string;
    productName: string;
    customerName: string;
    rating: number;
    comment: string;
    media: ReviewMedia[];
    status: string; // Updated to match Enum (PUBLISHED, HIDDEN, ARCHIVED)
    hideReason: string | null;
    createdAt: string;
    isRead: boolean;
    reply: string | null;
    isPinned: boolean;
    isAnonymous: boolean;
}

interface ReviewStats {
    totalReviews: number;
    averageRating: number;
    oneStar: number;
    twoStars: number;
    threeStars: number;
    fourStars: number;
    fiveStars: number;
    unReadReview?: number;
}

const ExpandableComment = ({ text, maxLength = 200, isExpanded, onToggle }: { 
    text: string; 
    maxLength?: number;
    isExpanded: boolean;
    onToggle: () => void;
}) => {
    const commentStyle = { fontSize: '14px', lineHeight: '1.6' };
    
    if (!text) return <span style={{ ...commentStyle, color: '#6b7280' }}>No comment</span>;
    if (text.length <= maxLength) return <div style={commentStyle}>{text}</div>;

    return (
        <div style={commentStyle}>
            {isExpanded ? text : `${text.substring(0, maxLength)}...`}
            <span style={{ marginLeft: '4px' }}>
                <Button
                    variant="plain"
                    size="micro"
                    onClick={onToggle}
                >
                    {isExpanded ? "Show less" : "See more"}
                </Button>
            </span>
        </div>
    );
};

const formatRelativeTime = (dateString: string) => {
    if (!dateString) return "";
    const now = new Date();
    const then = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} days ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} months ago`;
    
    return then.toLocaleDateString();
};

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [ratingFilter, setRatingFilter] = useState<string>("");
    const [productSearch, setProductSearch] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [readFilter, setReadFilter] = useState<string>("");
    const [hideReasons, setHideReasons] = useState<{ label: string, value: string }[]>([]);
    const [isHideModalOpen, setIsHideModalOpen] = useState(false);
    const [selectedHideReason, setSelectedHideReason] = useState<string>("");
    const [currentReview, setCurrentReview] = useState<Review | null>(null);
    const [updating, setUpdating] = useState<number | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [parentForReplies, setParentForReplies] = useState<Review | null>(null);
    const [adminResponse, setAdminResponse] = useState("");
    const [savingResponse, setSavingResponse] = useState(false);
    const [currentReplyId, setCurrentReplyId] = useState<number | null>(null);

    // Expansion tracking
    const [expandedId, setExpandedId] = useState<string | null>(null);


    const fetchReviews = useCallback(async (pageIndex = 0, ratingVal = "", productVal = "", statusVal = "", readVal = "") => {
        setLoading(true);
        try {
            const params: any = { page: pageIndex, size: 10 };
            if (ratingVal) params.rating = parseInt(ratingVal);
            if (productVal) {
                // If it looks like a numeric ID (Liquid ID or Database ID usually long), 
                // but let's just pass it as productName/productId to search
                params.productName = productVal;
                // Backend specification uses .like filter for productName
            }
            if (statusVal === 'PUBLISHED') params.status = true;
            else if (statusVal === 'HIDDEN') params.status = false;
            
            if (readVal === 'READ') params.isRead = true;
            else if (readVal === 'UNREAD') params.isRead = false;

            const response = await apiClient.get(`/reviews`, { params });
            const payload = response.data;
            if (payload && payload.content) {
                setReviews(payload.content);
                setTotalPages(payload.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setLoading(false);
        }
    }, []);


    const fetchHideReasons = async () => {
        try {
            const res = await apiClient.get("/reviews/hide-reasons");
            if (res.data) {
                setHideReasons(res.data);
            }
        } catch (e) {
            console.error("Failed to fetch hide reasons", e);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await apiClient.get("/reviews/stats");
            const payload = res.data;
            console.log("Stats payload:", payload);
            if (payload && (typeof payload.totalReviews === 'number' || typeof payload.totalReviews === 'string')) {
                setStats(payload);
            }
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    };

    useEffect(() => {
        fetchReviews(page, ratingFilter, productSearch, statusFilter, readFilter);
    }, [page, ratingFilter, productSearch, statusFilter, readFilter, fetchReviews]);

    useEffect(() => {
        fetchStats();
        fetchHideReasons();
    }, []);

    const handleMarkAsRead = async (ids: number[], isRead: boolean = true) => {
        // Optimistic update
        setReviews(prev => prev.map(r => 
            ids.includes(r.id) ? { ...r, isRead } : r
        ));

        try {
            await apiClient.put("/reviews/read", ids, {
                params: { isRead }
            });
            // No need to fetchReviews here as we updated optimistically, 
            // but we fetch stats to keep them in sync
            fetchStats();
        } catch (e) {
            console.error("Failed to update read status", e);
            // Rollback if needed (for simplicity, we usually refresh on error)
            fetchReviews(page, ratingFilter, productSearch, statusFilter, readFilter);
        }
    };

    const handleOpenResponseModal = (review: Review) => {
        setParentForReplies(review);
        setIsResponseModalOpen(true);
        setAdminResponse(review.reply || "");
        setCurrentReplyId(null); // No longer needed for flattening
        setExpandedId(null);
        
        // If not read, mark it as read when opening to reply
        if (!review.isRead) {
            handleMarkAsRead([review.id]);
        }
    };

    const handleRatingChange = (value: string) => {
        setRatingFilter(value);
        setPage(0);
    };

    const handleProductChange = (value: string) => {
        setProductSearch(value);
        setPage(0);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setPage(0);
    };

    const handleReadChange = (value: string) => {
        setReadFilter(value);
        setPage(0);
    };

    const handleSaveResponse = async () => {
        if (!parentForReplies || !adminResponse.trim()) return;
        setSavingResponse(true);
        try {
            await apiClient.post(`/reviews?shop=${parentForReplies.shop}`, {
                productId: parentForReplies.productId,
                productName: parentForReplies.productName,
                customerName: "Admin",
                comment: adminResponse,
                replyTo: parentForReplies.id,
                rating: null,
                media: []
            });
            setIsResponseModalOpen(false);
            fetchReviews(page, ratingFilter, productSearch, statusFilter, readFilter);
        } catch (e) {
            console.error("Failed to save response", e);
        } finally {
            setSavingResponse(false);
        }
    };

    const handleTogglePin = async (review: Review) => {
        const newPinnedStatus = !review.isPinned;
        try {
            await apiClient.put(`/reviews/${review.id}/${newPinnedStatus ? 'pin' : 'unpin'}`);
            fetchReviews(page, ratingFilter, productSearch, statusFilter, readFilter);
        } catch (e) {
            console.error("Failed to toggle pin", e);
        }
    };

    const handleToggleStatus = async (review: Review) => {
        if (review.status === 'PUBLISHED') {
            // If currently published -> Hide
            setCurrentReview(review);
            setSelectedHideReason(hideReasons[0]?.value || "");
            setIsHideModalOpen(true);
        } else {
            // If currently hidden -> Publish
            await updateReviewStatus(review.id, 'PUBLISHED');
        }
    };

    const updateReviewStatus = async (id: number, status: string, hideReason?: string) => {
        setUpdating(id);
        try {
            await apiClient.put("/reviews", {
                id,
                status,
                hideReason
            });
            
            // Refresh main data
            fetchReviews(page, ratingFilter, productSearch, statusFilter, readFilter);
            fetchStats();
        } catch (e) {
            console.error("Failed to update status", e);
        } finally {
            setUpdating(null);
        }
    };

    const handleHideConfirm = async () => {
        if (currentReview) {
            await updateReviewStatus(currentReview.id, 'HIDDEN', selectedHideReason);
            setIsHideModalOpen(false);
            setCurrentReview(null);
        }
    };

    const resourceName = { singular: "review", plural: "reviews" };
    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(reviews as unknown as { [key: string]: unknown; id: string }[]);

    const rowMarkup = reviews.map(
        (review, index) => {
            const { id, customerName, rating, comment, createdAt, productName, media, status, shop, hideReason, isRead, isPinned, isAnonymous } = review;
            const displayRating = rating || 0;
            const isPublished = status === 'PUBLISHED';
            const isHidden = status === 'HIDDEN';
            const rowStyle = isRead ? { opacity: 0.7, filter: 'grayscale(0.5)' } : { backgroundColor: '#f9f9f9' };

            return (
                <IndexTable.Row
                    id={id.toString()}
                    key={id}
                    selected={selectedResources.includes(id.toString())}
                    position={index}
                    disabled={isRead}
                    tone={isRead ? "subdued" : undefined}
                >
                    <IndexTable.Cell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Text variant="bodyMd" fontWeight="bold" as="span">
                                    {customerName || 'Customer'}
                                </Text>
                                {isRead ? (
                                    <Icon source={CheckCircleIcon} tone="success" />
                                ) : (
                                    <span style={{ width: '8px', height: '8px', backgroundColor: '#008060', borderRadius: '50%', display: 'inline-block' }} title="New/Unread" />
                                )}
                            </div>
                            
                            <div style={{ fontSize: '14px', textDecoration: 'underline', color: '#2c6ecb', cursor: 'pointer' }}>
                                {productName || 'Unknown Product'}
                            </div>
                            
                            <div style={{ marginTop: '4px' }}>
                                <Button
                                    icon={PinIcon}
                                    size="micro"
                                    variant="tertiary"
                                    onClick={() => handleTogglePin(review)}
                                    pressed={isPinned}
                                />
                            </div>
                        </div>
                    </IndexTable.Cell>
                    
                    <IndexTable.Cell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '450px', width: '100%', padding: '12px 24px' }}>
                            {/* Rating */}
                            {displayRating > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#fbbf24', display: 'flex' }}>
                                        {[...Array(displayRating)].map((_, i) => (
                                            <Icon key={i} source={StarFilledIcon} tone="warning" />
                                        ))}
                                    </span>
                                </div>
                            )}

                            {/* Media */}
                            {media && media.length > 0 && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    {media.slice(0, 5).map(m => (
                                        <div 
                                            key={m.id} 
                                            onClick={() => setZoomedImage(m.mediaUrl)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Thumbnail
                                                source={m.mediaType === "IMAGE" ? m.mediaUrl : ""}
                                                alt="media"
                                                size="large"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                             {/* Reply Button */}
                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                 <Button 
                                     size="micro" 
                                     variant="primary"
                                     onClick={() => handleOpenResponseModal(review)}
                                 >
                                     {review.reply ? "Edit reply" : "Reply now"}
                                 </Button>
                             </div>

                            {/* Comment */}
                            <div style={{ 
                                whiteSpace: 'normal', 
                                wordBreak: 'break-word', 
                                marginTop: '4px', 
                                fontSize: '14px', 
                                lineHeight: '1.6',
                                color: '#1f2937'
                            }}>
                               <ExpandableComment 
                                    text={comment} 
                                    isExpanded={expandedId === `review-${id}`}
                                    onToggle={() => setExpandedId(expandedId === `review-${id}` ? null : `review-${id}`)}
                               />
                            </div>

                            {/* Admin Reply Preview */}
                            {review.reply && (
                                <div style={{ 
                                    marginTop: '8px', 
                                    padding: '16px', 
                                    backgroundColor: '#e0f7f9', 
                                    borderRadius: '12px',
                                    borderLeft: '5px solid #086c7e',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#086c7e' }}>
                                        <Text variant="bodyMd" fontWeight="bold" as="span">Store Response</Text>
                                    </div>
                                    <div style={{ 
                                        wordBreak: 'break-word', 
                                        whiteSpace: 'normal', 
                                        fontSize: '14px', 
                                        lineHeight: '1.6', 
                                        color: '#374151' 
                                    }}>
                                        {review.reply}
                                    </div>
                                </div>
                            )}
                        </div>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: 'max-content' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Badge tone={isPublished ? 'success' : 'critical'}>
                                    {isPublished ? 'Published' : 'Hidden'}
                                </Badge>
                                <Button
                                    size="micro"
                                    onClick={() => handleToggleStatus(review)}
                                    loading={updating === id}
                                >
                                    {isPublished ? "Hide" : "Publish"}
                                </Button>
                            </div>
                            {isHidden && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Badge tone="warning" size="small">
                                        {hideReason ? `Reason: ${hideReason}` : 'Reason: N/A'}
                                    </Badge>
                                    <Button
                                        variant="plain"
                                        size="micro"
                                        onClick={() => {
                                            setCurrentReview(review);
                                            setSelectedHideReason(hideReason || hideReasons[0]?.value || "");
                                            setIsHideModalOpen(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                </div>
                            )}
                        </div>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <div style={{ width: 'max-content' }}>
                            {formatRelativeTime(createdAt)}
                        </div>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Checkbox
                                label=""
                                checked={isRead}
                                onChange={() => handleMarkAsRead([id], !isRead)}
                            />
                        </div>
                    </IndexTable.Cell>
                </IndexTable.Row>
            );
        }
    );

    const filters = [
        {
            key: 'rating',
            label: 'Rating',
            filter: (
                <Select
                    label="Rating"
                    labelInline
                    options={[
                        { label: 'All Ratings', value: '' },
                        { label: '5 Stars', value: '5' },
                        { label: '4 Stars', value: '4' },
                        { label: '3 Stars', value: '3' },
                        { label: '2 Stars', value: '2' },
                        { label: '1 Star', value: '1' },
                    ]}
                    value={ratingFilter}
                    onChange={handleRatingChange}
                />
            ),
            shortcut: true,
        },
    ];

    return (
        <Page title="Product Reviews" fullWidth>
            <Layout>
                {/* Statistics Section */}
                {stats && (
                    <Layout.Section>
                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <LegacyCard sectioned>
                                    <Text variant="headingSm" as="h6">Total Reviews</Text>
                                    <Text variant="heading2xl" as="p">{stats.totalReviews}</Text>
                                </LegacyCard>
                            </Grid.Cell>
                            
                            {stats.unReadReview !== undefined && (
                                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                    <LegacyCard sectioned>
                                        <Text variant="headingSm" as="h6">Unread Reviews</Text>
                                        <Text variant="heading2xl" tone="critical" as="p">{stats.unReadReview}</Text>
                                    </LegacyCard>
                                </Grid.Cell>
                            )}

                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <LegacyCard sectioned>
                                    <Text variant="headingSm" as="h6">Average Rating</Text>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Text variant="heading2xl" as="p">{stats.averageRating}</Text>
                                        <div style={{ transform: 'scale(2)', transformOrigin: 'left center' }}>
                                            <Icon source={StarFilledIcon} tone="warning" />
                                        </div>
                                    </div>
                                </LegacyCard>
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <LegacyCard sectioned>
                                    <Text variant="headingSm" as="h6">Breakdown</Text>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', fontSize: '13px' }}>
                                        <Badge tone="success">{`5★: ${stats.fiveStars}`}</Badge>
                                        <Badge tone="info">{`4★: ${stats.fourStars}`}</Badge>
                                        <Badge>{`3★: ${stats.threeStars}`}</Badge>
                                        <Badge tone="attention">{`2★: ${stats.twoStars}`}</Badge>
                                        <Badge tone="critical">{`1★: ${stats.oneStar}`}</Badge>
                                    </div>
                                </LegacyCard>
                            </Grid.Cell>
                        </Grid>
                    </Layout.Section>
                )}

                <Layout.Section>
                    <Card padding="0">
                        <div style={{ padding: '16px', borderBottom: '1px solid #e1e3e5', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                            <div style={{ flex: '2', minWidth: '200px' }}>
                                <TextField
                                    label="Search Product Name or ID"
                                    value={productSearch}
                                    onChange={handleProductChange}
                                    autoComplete="off"
                                    placeholder="e.g. T-shirt"
                                    clearButton
                                    onClearButtonClick={() => handleProductChange("")}
                                />
                            </div>
                            <div style={{ flex: '1', minWidth: '120px' }}>
                                <Select
                                    label="Rating"
                                    options={[
                                        { label: 'All Ratings', value: '' },
                                        { label: '5 Stars', value: '5' },
                                        { label: '4 Stars', value: '4' },
                                        { label: '3 Stars', value: '3' },
                                        { label: '2 Stars', value: '2' },
                                        { label: '1 Star', value: '1' },
                                    ]}
                                    value={ratingFilter}
                                    onChange={handleRatingChange}
                                />
                            </div>
                            <div style={{ flex: '1', minWidth: '120px' }}>
                                <Select
                                    label="Status"
                                    options={[
                                        { label: 'All Status', value: '' },
                                        { label: 'Published', value: 'PUBLISHED' },
                                        { label: 'Hidden', value: 'HIDDEN' },
                                    ]}
                                    value={statusFilter}
                                    onChange={handleStatusChange}
                                />
                            </div>
                            <div style={{ flex: '1', minWidth: '120px' }}>
                                <Select
                                    label="Read Status"
                                    options={[
                                        { label: 'All', value: '' },
                                        { label: 'Read', value: 'READ' },
                                        { label: 'Unread', value: 'UNREAD' },
                                    ]}
                                    value={readFilter}
                                    onChange={handleReadChange}
                                />
                            </div>
                        </div>

                        <IndexTable
                            resourceName={resourceName}
                            itemCount={reviews.length}
                            selectable={false}
                            headings={[
                                { title: "Details" },
                                { title: "Review Content" },
                                { title: "Status" },
                                { title: "Date" },
                                { title: "Read" },
                            ]}
                            loading={loading}
                            emptyState={
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <Text as="p" variant="bodyMd" tone="subdued">
                                        Chưa có review nào. Reviews sẽ xuất hiện ở đây khi khách hàng đánh giá sản phẩm.
                                    </Text>
                                </div>
                            }
                        >
                            {rowMarkup}
                        </IndexTable>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                            <Pagination
                                hasPrevious={page > 0}
                                onPrevious={() => setPage(page - 1)}
                                hasNext={page < totalPages - 1}
                                onNext={() => setPage(page + 1)}
                            />
                        </div>
                    </Card>
                </Layout.Section>
            </Layout>

            <Modal
                open={isHideModalOpen}
                onClose={() => setIsHideModalOpen(false)}
                title="Reason for hiding review"
                primaryAction={{
                    content: 'Hide Review',
                    onAction: handleHideConfirm,
                    loading: updating === currentReview?.id
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => setIsHideModalOpen(false),
                    },
                ]}
            >
                <Modal.Section>
                    <Select
                        label="Select a reason"
                        options={hideReasons}
                        value={selectedHideReason}
                        onChange={(val: string) => setSelectedHideReason(val)}
                    />
                </Modal.Section>
            </Modal>

            {/* Admin Response Modal */}
            <Modal
                open={isResponseModalOpen}
                onClose={() => setIsResponseModalOpen(false)}
                title={currentReplyId ? "Edit Admin Response" : "Add Admin Response"}
                primaryAction={{
                    content: currentReplyId ? 'Update Response' : 'Send Response',
                    onAction: handleSaveResponse,
                    loading: savingResponse
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => setIsResponseModalOpen(false),
                    },
                ]}
            >
                <Modal.Section>
                    {loadingReplies ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}><Text as="p">Loading existing response...</Text></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ padding: '12px', background: '#f6f6f7', borderRadius: '8px' }}>
                                <Text variant="bodySm" tone="subdued" as="p">Replying to {parentForReplies?.customerName}:</Text>
                                <Text variant="bodyMd" as="p">"{parentForReplies?.comment}"</Text>
                            </div>
                            <TextField
                                label="Response Message"
                                value={adminResponse}
                                onChange={(val) => setAdminResponse(val)}
                                multiline={4}
                                autoComplete="off"
                                placeholder="Type your response here..."
                            />
                        </div>
                    )}
                </Modal.Section>
            </Modal>

            {/* Image Zoom Modal */}
            <Modal
                open={!!zoomedImage}
                onClose={() => setZoomedImage(null)}
                title="View Image"
                size="large"
                secondaryActions={[
                    {
                        content: 'Close',
                        onAction: () => setZoomedImage(null),
                    },
                ]}
            >
                <Modal.Section>
                    {zoomedImage && (
                        <div style={{ display: 'flex', justifyContent: 'center', background: '#f6f6f7', padding: '20px' }}>
                            <img 
                                src={zoomedImage} 
                                alt="Zoomed review media" 
                                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
                            />
                        </div>
                    )}
                </Modal.Section>
            </Modal>
        </Page>
    );
}
